import os
import json
from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

# Define paths relative to the current file's location
BACKEND_DIR = os.path.dirname(__file__)
ATC_DIR = os.path.join(BACKEND_DIR, 'atc')

class Architecture(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@router.get("/{provider}/components")
async def list_components(provider: str):
    components_dir = os.path.join(ATC_DIR, provider, 'components')
    if not os.path.isdir(components_dir):
        raise HTTPException(status_code=404, detail=f"Provider '{provider}' not found.")

    components = []
    for filename in os.listdir(components_dir):
        if filename.endswith(".json"):
            filepath = os.path.join(components_dir, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
                components.append({
                    "name": data.get("name"),
                    "type": data.get("type"),
                    "icon_path": f"/api/atc/{provider}/icons/{data.get('icon')}"
                })
    return components

@router.get("/{provider}/components/{component_type}")
async def get_component_details(provider: str, component_type: str):
    components_dir = os.path.join(ATC_DIR, provider, 'components')
    # Component types from the frontend will be like 'gcp_cloud_storage'.
    # The JSON files are named 'cloud_storage.json'.
    # We need to strip the prefix to find the file.
    prefix = f"{provider}_"
    if component_type.startswith(prefix):
        filename = f"{component_type[len(prefix):]}.json"
    else:
        filename = f"{component_type}.json"

    filepath = os.path.join(components_dir, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Component not found")

    with open(filepath, 'r') as f:
        return json.load(f)

@router.get("/{provider}/icons/{icon_name}")
async def get_icon(provider: str, icon_name: str):
    icons_dir = os.path.join(ATC_DIR, provider, 'icons')
    filepath = os.path.join(icons_dir, icon_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Icon not found")
    return FileResponse(filepath)

@router.post("/{provider}/architectures")
async def save_architecture(provider: str, architecture: Architecture):
    architectures_dir = os.path.join(ATC_DIR, provider, 'architectures')
    os.makedirs(architectures_dir, exist_ok=True)
    filepath = os.path.join(architectures_dir, 'current_architecture.json')
    with open(filepath, 'w') as f:
        json.dump(architecture.dict(), f, indent=2)
    return {"status": "success", "message": "Architecture saved"}

@router.get("/{provider}/architectures/current")
async def load_architecture(provider: str):
    architectures_dir = os.path.join(ATC_DIR, provider, 'architectures')
    filepath = os.path.join(architectures_dir, 'current_architecture.json')
    if not os.path.exists(filepath):
        return {"nodes": [], "edges": []} # Return empty if no architecture saved
    
    with open(filepath, 'r') as f:
        return json.load(f)
