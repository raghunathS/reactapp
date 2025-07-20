import os
import json
from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

# Define paths relative to the current file's location
ATC_DIR = os.path.dirname(__file__)
COMPONENTS_DIR = os.path.join(ATC_DIR, 'atc', 'gcp', 'components')
ICONS_DIR = os.path.join(ATC_DIR, 'atc', 'gcp', 'icons')
ARCHITECTURES_DIR = os.path.join(ATC_DIR, 'atc', 'gcp', 'architectures')

# Ensure the architectures directory exists
os.makedirs(ARCHITECTURES_DIR, exist_ok=True)

class Architecture(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@router.get("/gcp/components")
async def list_gcp_components():
    components = []
    for filename in os.listdir(COMPONENTS_DIR):
        if filename.endswith(".json"):
            filepath = os.path.join(COMPONENTS_DIR, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
                components.append({
                    "name": data.get("name"),
                    "type": data.get("type"),
                    "icon_path": f"/api/atc/gcp/icons/{data.get('icon')}"
                })
    return components

@router.get("/gcp/components/{component_type}")
async def get_gcp_component_details(component_type: str):
    # Component types from the frontend will be like 'gcp_cloud_storage'.
    # The JSON files are named 'cloud_storage.json'.
    # We need to strip the prefix to find the file.
    if component_type.startswith('gcp_'):
        filename = f"{component_type[4:]}.json"
    else:
        filename = f"{component_type}.json"

    filepath = os.path.join(COMPONENTS_DIR, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Component '{component_type}' not found.")

    with open(filepath, 'r') as f:
        data = json.load(f)
    return data

@router.get("/gcp/icons/{icon_name}")
async def get_gcp_icon(icon_name: str):
    filepath = os.path.join(ICONS_DIR, icon_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Icon not found")
    return FileResponse(filepath)


@router.post("/gcp/architectures/{architecture_name}")
async def save_architecture(architecture_name: str, architecture: Architecture):
    """Saves an architecture design to a JSON file."""
    if not architecture_name.isalnum():
        raise HTTPException(status_code=400, detail="Architecture name must be alphanumeric.")
    
    filepath = os.path.join(ARCHITECTURES_DIR, f"{architecture_name}.json")
    try:
        with open(filepath, 'w') as f:
            json.dump(architecture.dict(), f, indent=2)
        return {"message": f"Architecture '{architecture_name}' saved successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save architecture: {e}")

@router.get("/gcp/architectures")
async def list_saved_architectures():
    """Lists all saved architecture files."""
    try:
        files = [f.replace('.json', '') for f in os.listdir(ARCHITECTURES_DIR) if f.endswith('.json')]
        return {"architectures": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list architectures: {e}")

@router.get("/gcp/architectures/{architecture_name}")
async def load_architecture(architecture_name: str):
    """Loads a specific architecture design from a JSON file."""
    filepath = os.path.join(ARCHITECTURES_DIR, f"{architecture_name}.json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Architecture not found.")
    
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load architecture: {e}")
