import os
import json
import subprocess
import logging
from io import StringIO
from typing import Optional, List, Dict, Any

import pandas as pd
import google.generativeai as genai

from dotenv import load_dotenv
from fastapi import FastAPI, Query, HTTPException, Body, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

import atc

# Load environment variables from .env file
load_dotenv()

# Configure the generative AI model with the API key
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file or is empty")
genai.configure(api_key=api_key)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mock Confluence Data
confluence_page_tree = [
    {
        "id": "1",
        "text": "Project Alpha",
        "items": [
            {"id": "11", "text": "Overview"},
            {"id": "12", "text": "Requirements"},
            {
                "id": "13",
                "text": "Design",
                "items": [
                    {"id": "131", "text": "API Design"},
                    {"id": "132", "text": "Database Schema"},
                ],
            },
        ],
    },
    {
        "id": "2",
        "text": "Onboarding Guide",
        "items": [
            {"id": "21", "text": "First Steps"},
            {"id": "22", "text": "Development Setup"},
        ],
    },
]

confluence_pages = {
    "11": "<h1>Project Alpha Overview</h1><p>This is the overview page for Project Alpha.</p><h2>Goals</h2><p>Our goal is to build the best dashboard ever.</p>",
    "12": "<h1>Requirements</h1><p>The requirements are extensive.</p><h2>Functional</h2><ul><li>Must do X</li><li>Must do Y</li></ul>",
    "131": "<h1>API Design</h1><p>The API is RESTful.</p><h2>Endpoints</h2><h3>GET /api/tickets</h3><p>Returns a list of tickets.</p>",
    "132": "<h1>Database Schema</h1><p>We use PostgreSQL.</p><h2>Tables</h2><h3>Users</h3><p>Stores user information.</p>",
    "21": "<h1>First Steps</h1><p>Welcome to the team!</p><h2>Account Setup</h2><p>Please create your accounts.</p>",
    "22": "<h1>Development Setup</h1><p>Clone the repository and run npm install.</p><h2>Prerequisites</h2><p>You will need Node.js and Python.</p>",
}

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
    "http://localhost:3007",
    "http://localhost:3008",
    "http://localhost:3009",
    "http://localhost:3010",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the ATC router to make its endpoints available
app.include_router(atc.router, prefix="/api/atc", tags=["atc"])

tickets_df = None
aws_heartbeat_df = None
gcp_heartbeat_df = None
aging_df = None

class CSPStatistics(BaseModel):
    total_tickets: int
    monthly_average: float

class EnvironmentSummaryResponse(BaseModel):
    aws: List[Dict[str, Any]]
    gcp: List[Dict[str, Any]]
    aws_stats: CSPStatistics
    gcp_stats: CSPStatistics

@app.on_event("startup")
def startup_event():
    """Load and combine AWS and GCP ticket datasets into memory when the application starts."""
    global tickets_df
    try:
        aws_df = pd.read_csv('aws_ticket_data.csv')
        gcp_df = pd.read_csv('gcp_ticket_data.csv')
        tickets_df = pd.concat([aws_df, gcp_df], ignore_index=True)
        
        tickets_df['tCreated'] = pd.to_datetime(tickets_df['tCreated'])
        tickets_df['tResolved'] = pd.to_datetime(tickets_df['tResolved'], errors='coerce')
        tickets_df['Priority'] = tickets_df['Priority'].fillna('unknown')
        print("AWS and GCP ticket data loaded and combined successfully.")
    except FileNotFoundError as e:
        print(f"Error: {e.filename} not found. Starting with an empty DataFrame.")
        tickets_df = pd.DataFrame()
    except Exception as e:
        print(f"An error occurred during data loading: {e}")
        tickets_df = pd.DataFrame()

    global aws_heartbeat_df, gcp_heartbeat_df
    try:
        aws_heartbeat_df = pd.read_csv('aws_heartbeat_ticket_data.csv')
        aws_heartbeat_df['tCreated'] = pd.to_datetime(aws_heartbeat_df['tCreated'])
        gcp_heartbeat_df = pd.read_csv('gcp_heartbeat_ticket_data.csv')
        gcp_heartbeat_df['tCreated'] = pd.to_datetime(gcp_heartbeat_df['tCreated'])
        print("Heartbeat data loaded successfully.")
    except FileNotFoundError:
        logger.error("Heartbeat data files not found. Heartbeat charts will be unavailable.")
        aws_heartbeat_df = pd.DataFrame()
        gcp_heartbeat_df = pd.DataFrame()

    global aging_df
    try:
        aging_data_path = os.path.join(os.path.dirname(__file__), 'data', 'soc_output_summary.csv')
        aging_df = pd.read_csv(aging_data_path)
        logger.info("Aging summary data loaded successfully.")
    except FileNotFoundError:
        logger.error("soc_output_summary.csv not found. Aging summary will be unavailable.")
        aging_df = pd.DataFrame()
    except Exception as e:
        logger.error(f"An unexpected error occurred while loading aging data: {e}")
        aging_df = pd.DataFrame()

def get_data(year: Optional[int] = None, environment: Optional[str] = None, narrow_environment: Optional[str] = None) -> pd.DataFrame:
    """
    Helper function to get a copy of the dataframe, filtered by year and environment if provided.
    """
    if tickets_df is None:
        return pd.DataFrame()
    df = tickets_df.copy()
    if year:
        df = df[df['tCreated'].dt.year == year]

    # Apply environment filters only if they are not 'All' or None
    if environment and environment != 'All':
        df = df[df['Environment'] == environment]
    
    if narrow_environment and narrow_environment != 'All':
        df = df[df['NarrowEnvironment'] == narrow_environment]
        
    return df

@app.get("/api/confluence/page-tree")
async def get_confluence_page_tree():
    return confluence_page_tree

@app.get("/api/confluence/page/{page_id}")
async def get_confluence_page(page_id: str):
    return {"html_content": confluence_pages.get(page_id, "<h1>Page Not Found</h1>")}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://localhost:3006", "http://localhost:3007", "http://localhost:3008", "http://localhost:3009", "http://localhost:3010"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/tickets-filter-options")
def get_ticket_filter_options():
    """
    Provides the unique values for filterable ticket columns.
    """
    try:
        if tickets_df is None or tickets_df.empty:
            return {
                "Priority": [], "CSP": [], "AppCode": [], 
                "Environment": [], "NarrowEnvironment": []
            }
        options = {
            "Priority": sorted([str(p) for p in tickets_df['Priority'].unique()]),
            "CSP": sorted([str(c) for c in tickets_df['CSP'].unique()]),
            "AppCode": sorted([str(a) for a in tickets_df['AppCode'].unique()]),
            "Environment": sorted([str(e) for e in tickets_df['Environment'].dropna().unique()]),
            "NarrowEnvironment": sorted([str(n) for n in tickets_df['NarrowEnvironment'].dropna().unique()]),
        }
        return options
    except Exception as e:
        logger.error(f"Error in /api/tickets-filter-options: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tickets")
def get_tickets(
    page: int = 1,
    size: int = 25,
    sort_by: str = 'Key',
    sort_order: str = 'asc',
    # Global filters passed from the header dropdowns
    year: Optional[int] = None,
    global_environment: Optional[str] = None,
    global_narrow_environment: Optional[str] = None,
    # Per-column filters from the table's filter inputs
    Key: Optional[str] = None,
    Summary: Optional[str] = None,
    Priority: Optional[str] = None,
    CSP: Optional[str] = None,
    AppCode: Optional[str] = None,
    column_environment: Optional[str] = None, # Renamed to avoid conflict with global filter
    column_narrow_environment: Optional[str] = None, # Renamed to avoid conflict with global filter
    AlertType: Optional[str] = None,
    ConfigRule: Optional[str] = None,
    Account: Optional[str] = None
):
    """Endpoint to get a paginated list of tickets with optional filtering and sorting."""
    try:
        # 1. Apply global filters first.
        df = get_data(year, global_environment, global_narrow_environment)

        # 2. Apply per-column filters from the table UI.
        # Note: The 'Environment' and 'NarrowEnvironment' params here are from the table's column filters.
        if Key:
            df = df[df['Key'].str.contains(Key, case=False, na=False)]
        if Summary:
            df = df[df['Summary'].str.contains(Summary, case=False, na=False)]
        if Priority:
            df = df[df['Priority'].str.contains(Priority, case=False, na=False)]
        if CSP:
            df = df[df['CSP'].str.contains(CSP, case=False, na=False)]
        if AppCode:
            df = df[df['AppCode'].str.contains(AppCode, case=False, na=False)]
        if column_environment: # This is the per-column filter
            df = df[df['Environment'].str.contains(column_environment, case=False, na=False)]
        if column_narrow_environment: # This is the per-column filter
            df = df[df['NarrowEnvironment'].str.contains(column_narrow_environment, case=False, na=False)]
        if AlertType:
            df = df[df['AlertType'].str.contains(AlertType, case=False, na=False)]
        if ConfigRule:
            df = df[df['ConfigRule'].str.contains(ConfigRule, case=False, na=False)]
        if Account:
            df = df[df['Account'].str.contains(Account, case=False, na=False)]

        # 3. Sorting
        if sort_by and sort_order:
            ascending = sort_order == 'asc'
            if sort_by == 'Key':
                # Use a numeric sort for the 'Key' column
                df['sort_key'] = df['Key'].str.extract('(\\d+)').astype(int)
                df = df.sort_values(by='sort_key', ascending=ascending).drop(columns=['sort_key'])
            elif sort_by in df.columns:
                df = df.sort_values(by=sort_by, ascending=ascending)

        # 4. Get total count *after* all filtering and sorting
        total_count = len(df)

        # 5. Pagination
        total_pages = (total_count + size - 1) // size
        start_index = (page - 1) * size
        end_index = start_index + size
        paginated_df = df.iloc[start_index:end_index].copy()

        for col in ['tCreated', 'tResolved']:
            if col in paginated_df.columns:
                paginated_df[col] = paginated_df[col].apply(lambda x: x.isoformat() if pd.notna(x) else None)

        paginated_df.fillna('', inplace=True)

        return {
            "tickets": paginated_df.to_dict(orient='records'),
            "total_count": total_count,
            "total_pages": total_pages
        }
    except Exception as e:
        logger.error(f"Error in /api/tickets: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/csp-vs-priority")
async def get_csp_vs_priority():
    csp_priority_counts = tickets_df.groupby(['CSP', 'Priority']).size().unstack(fill_value=0)
    for priority in ['Low', 'Medium', 'High', 'unknown']:
        if priority not in csp_priority_counts.columns:
            csp_priority_counts[priority] = 0
    return csp_priority_counts.to_dict(orient='index')

@app.get("/api/appcode-vs-priority")
async def get_appcode_vs_priority():
    heatmap_data = tickets_df.groupby(['AppCode', 'Priority']).size().unstack(fill_value=0)
    for priority in ['Low', 'Medium', 'High', 'unknown']:
        if priority not in heatmap_data.columns:
            heatmap_data[priority] = 0
    heatmap_data = heatmap_data[['Low', 'Medium', 'High', 'unknown']]
    return heatmap_data.reset_index().to_dict(orient='records')

@app.get("/api/environment-summary", response_model=EnvironmentSummaryResponse)
def get_environment_summary(year: Optional[int] = None, environment: Optional[str] = None, narrow_environment: Optional[str] = None):
    logger.info(f"--- Starting /api/environment-summary (year: {year}) ---")
    try:
        df = get_data(year, environment, narrow_environment)

        if df.empty:
            logger.warning(f"No ticket data found for year {year} and other filters. Returning empty summary.")
            empty_stats = CSPStatistics(total_tickets=0, monthly_average=0)
            return EnvironmentSummaryResponse(
                aws=[], gcp=[], aws_stats=empty_stats, gcp_stats=empty_stats
            )

        df['tCreated'] = pd.to_datetime(df['tCreated'])
        df['Month'] = df['tCreated'].dt.to_period('M').astype(str)
        if environment and environment != 'All':
            stack_by_column = 'NarrowEnvironment'
        else:
            stack_by_column = 'Environment'

        df[stack_by_column] = df[stack_by_column].fillna('Unknown')
        
        all_stack_values = sorted(df[stack_by_column].unique().tolist())
        logger.info(f"Stacking by '{stack_by_column}'. Found unique values: {all_stack_values}")

        summary = df.groupby(['CSP', 'Month', stack_by_column]).size().unstack(fill_value=0)

        for value in all_stack_values:
            if value not in summary.columns:
                summary[value] = 0
        
        summary = summary.reset_index()
        logger.info(f"Summary table head:\n{summary.head()}")

        df_aws = df[df['CSP'] == 'AWS']
        df_gcp = df[df['CSP'] == 'GCP']

        aws_total = int(df_aws.shape[0])
        gcp_total = int(df_gcp.shape[0])

        current_year = 2025
        current_month = 7 

        if year == current_year:
            divisor = current_month
        else:
            divisor = 12

        aws_monthly_avg = round(aws_total / divisor, 1) if aws_total > 0 else 0
        gcp_monthly_avg = round(gcp_total / divisor, 1) if gcp_total > 0 else 0

        aws_stats = CSPStatistics(total_tickets=aws_total, monthly_average=aws_monthly_avg)
        gcp_stats = CSPStatistics(total_tickets=gcp_total, monthly_average=gcp_monthly_avg)

        aws_summary = summary[summary['CSP'] == 'AWS'].drop(columns='CSP')
        gcp_summary = summary[summary['CSP'] == 'GCP'].drop(columns='CSP')

        aws_summary_dict = aws_summary.to_dict(orient='records')
        gcp_summary_dict = gcp_summary.to_dict(orient='records')

        return EnvironmentSummaryResponse(
            aws=aws_summary_dict, 
            gcp=gcp_summary_dict,
            aws_stats=aws_stats,
            gcp_stats=gcp_stats
        )
    except Exception as e:
        logger.error(f"Error in /api/environment-summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports/ticket-count-by-appcode")
async def get_ticket_count_by_appcode(year: int, csp: str, environment: Optional[str] = None, narrow_environment: Optional[str] = None):
    df = get_data(year, environment, narrow_environment)
    df_csp = df[df['CSP'] == csp].copy()
    df_csp['Month'] = pd.to_datetime(df_csp['tCreated']).dt.strftime('%b')
    
    months_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    grouped = df_csp.groupby(['Month', 'AppCode']).size().reset_index(name='count')
    
    pivot_df = grouped.pivot(index='Month', columns='AppCode', values='count').fillna(0).astype(int)
    
    pivot_df = pivot_df.reindex(months_order, fill_value=0)
    
    app_codes = sorted(df_csp['AppCode'].unique().tolist())
    
    pivot_df = pivot_df.reindex(columns=app_codes, fill_value=0)
    
    chart_data = pivot_df.reset_index().to_dict(orient='records')
    
    return {
        "data": chart_data,
        "app_codes": app_codes,
    }

@app.get("/api/aging-filter-options")
async def get_aging_filter_options():
    if aging_df is None or aging_df.empty:
        return {
            "CSP": [],
            "Environment": [],
            "AlertType": [],
            "Priority": []
        }
    options = {
        "CSP": sorted(aging_df['CSP'].unique().tolist()),
        "Environment": sorted(aging_df['Environment'].unique().tolist()),
        "AlertType": sorted(aging_df['AlertType'].unique().tolist()),
        "Priority": sorted(aging_df['Priority'].unique().tolist()),
    }
    return options

@app.get("/api/aging-summary")
async def get_aging_summary(
    csp: Optional[str] = Query(None, alias="CSP"),
    environment: Optional[str] = Query(None, alias="Environment"),
    alert_type: Optional[str] = Query(None, alias="AlertType"),
    priority: Optional[str] = Query(None, alias="Priority")
):
    if aging_df is None or aging_df.empty:
        return []

    filtered_df = aging_df.copy()

    if csp and csp != 'All':
        filtered_df = filtered_df[filtered_df['CSP'] == csp]
    if environment and environment != 'All':
        filtered_df = filtered_df[filtered_df['Environment'] == environment]
    if alert_type and alert_type != 'All':
        filtered_df = filtered_df[filtered_df['AlertType'] == alert_type]
    if priority and priority != 'All':
        filtered_df = filtered_df[filtered_df['Priority'] == priority]

    # Define the desired sort order
    env_order = ['PROD', 'Non Prod']
    priority_order = ['Hightened', 'Critical', 'High', 'Medium', 'Low', 'Unknown']

    # Dynamically create categorical types based on what's in the data
    # This prevents errors if the CSV is missing a certain category
    env_categories_in_data = [e for e in env_order if e in filtered_df['Environment'].unique()]
    prio_categories_in_data = [p for p in priority_order if p in filtered_df['Priority'].unique()]

    if env_categories_in_data:
        filtered_df['Environment'] = pd.Categorical(filtered_df['Environment'], categories=env_categories_in_data, ordered=True)
    if prio_categories_in_data:
        filtered_df['Priority'] = pd.Categorical(filtered_df['Priority'], categories=prio_categories_in_data, ordered=True)

    # Sort the DataFrame by the desired hierarchy
    sorted_df = filtered_df.sort_values(by=['CSP', 'Environment', 'Priority', 'AlertType'])

    # Replace NaN with None for JSON compatibility before returning
    final_df = sorted_df.where(pd.notnull(sorted_df), None)
    return final_df.to_dict(orient='records')

@app.get("/api/appcode-trends-daily")
def get_appcode_trends_daily(year: int, month: int, csp: str, app_codes: str):
    """
    Provides daily trend data for a given list of AppCodes within a specific month.
    """
    df = get_data(year=year)
    df_csp = df[df['CSP'] == csp].copy()
    
    selected_app_codes = [code.strip() for code in app_codes.split(',')]
    
    df['tCreated'] = pd.to_datetime(df['tCreated'])
    df_month = df_csp[df_csp['tCreated'].dt.month == month]

    df_filtered = df_month[df_month['AppCode'].isin(selected_app_codes)]

    if df_filtered.empty:
        return {"daily_trend": [], "daily_heatmap": [], "app_codes": selected_app_codes}

    df_filtered['Day'] = df_filtered['tCreated'].dt.strftime('%Y-%m-%d')
    days_order = sorted(df_filtered['Day'].unique())

    # 1. Daily Trend data (Line chart)
    daily_trend_df = df_filtered.groupby('Day').size().reset_index(name='count')
    daily_trend_df = daily_trend_df.set_index('Day').reindex(days_order, fill_value=0).reset_index()
    daily_trend_data = daily_trend_df.to_dict(orient='records')

    # 2. Daily Heatmap data (for per-appcode lines)
    daily_heatmap_df = df_filtered.groupby(['Day', 'AppCode']).size().unstack(fill_value=0)
    daily_heatmap_df = daily_heatmap_df.reindex(days_order, fill_value=0)
    daily_heatmap_df = daily_heatmap_df.reindex(columns=selected_app_codes, fill_value=0)
    daily_heatmap_data = daily_heatmap_df.reset_index().to_dict(orient='records')

    return {
        "daily_trend": daily_trend_data,
        "daily_heatmap": daily_heatmap_data,
        "app_codes": selected_app_codes
    }


@app.get("/api/appcode-configrule-trends")
def get_appcode_configrule_trends(
    year: int,
    csp: str,
    app_codes: str,
    environment: Optional[str] = None,
    narrow_environment: Optional[str] = None
):
    """
    Provides monthly trend data for ConfigRules related to a given list of AppCodes.
    """
    df = get_data(year=year, environment=environment, narrow_environment=narrow_environment)
    df_csp = df[df['CSP'] == csp].copy()
    
    selected_app_codes = [code.strip() for code in app_codes.split(',')]
    df_filtered = df_csp[df_csp['AppCode'].isin(selected_app_codes)]
    
    # Drop rows where ConfigRule is NaN or empty, as they can't be trended
    df_filtered = df_filtered.dropna(subset=['ConfigRule'])
    df_filtered = df_filtered[df_filtered['ConfigRule'] != '']

    if df_filtered.empty:
        return {"trend_data": [], "config_rules": []}

    df_filtered['Month'] = pd.to_datetime(df_filtered['tCreated']).dt.strftime('%Y-%m')
    months_order = sorted(df_filtered['Month'].unique())
    config_rules_order = sorted(df_filtered['ConfigRule'].unique())

    trend_df = df_filtered.groupby(['Month', 'ConfigRule']).size().unstack(fill_value=0)
    trend_df = trend_df.reindex(months_order, fill_value=0)
    trend_df = trend_df.reindex(columns=config_rules_order, fill_value=0)
    trend_df['Total'] = trend_df.apply(pd.to_numeric).sum(axis=1)
    
    trend_data = trend_df.reset_index().to_dict(orient='records')

    return {
        "trend_data": trend_data,
        "config_rules": config_rules_order
    }

class ChatRequest(BaseModel):
    prompt: str
    model: Optional[str] = 'gemini-pro'

@app.get("/api/agent/models")
async def list_agent_models():
    try:
        # Filter models that support the 'generateContent' method
        models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        # We only want the user-friendly name (e.g., 'gemini-pro') not 'models/gemini-pro'
        cleaned_models = [name.replace('models/', '') for name in models]
        return {"models": cleaned_models}
    except Exception as e:
        logger.error(f"Error listing models: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve models.")

def run_aws_command(command: str) -> str:
    """Executes an AWS CLI command and returns the output."""
    try:
        # Security Note: In a real-world scenario, you'd want to sanitize this command string.
        # For this demo, we'll assume the commands are safe.
        result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Error executing command: {e}\nStderr: {e.stderr}"

def run_gcp_command(command: str) -> str:
    """Executes a GCP CLI (gcloud) command and returns the output."""
    try:
        result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Error executing command: {e}\nStderr: {e.stderr}"

@app.post("/api/agent/chat")
async def agent_chat(request: ChatRequest):
    try:
        model_name = request.model if request.model else 'gemini-pro'
        
        # Define the tools the model can use. The library inspects the function signature.
        tools = [run_aws_command, run_gcp_command]
        model = genai.GenerativeModel(model_name=model_name, tools=tools)
        
        # Start a chat session
        chat = model.start_chat()
        response = chat.send_message(request.prompt)

        # Handle tool calls from the model
        while response.parts and response.parts[0].function_call:
            function_call = response.parts[0].function_call
            
            available_tools = {
                "run_aws_command": run_aws_command,
                "run_gcp_command": run_gcp_command
            }
            
            function_name = function_call.name
            tool_function = available_tools.get(function_name)

            if tool_function:
                function_args = {key: value for key, value in function_call.args.items()}
                tool_output = tool_function(**function_args)
                
                # Send the tool's output back to the model in the correct format
                response = chat.send_message(
                    [dict(function_response=dict(name=function_name, response={"output": tool_output}))]
                )
            else:
                response = chat.send_message(
                    [dict(function_response=dict(name=function_name, response={"error": f"Tool '{function_name}' not found."}))]
                )

        return {"response": response.text}
    except Exception as e:
        logger.error(f"Error in /api/agent/chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/appcode-trends")
def get_appcode_trends(
    year: int, 
    csp: str, 
    app_codes: str,
    environment: Optional[str] = None, 
    narrow_environment: Optional[str] = None
):
    """
    Provides historical trend data for a given list of AppCodes.
    - app_codes: A comma-separated string of AppCodes.
    """
    df = get_data(year=year, environment=environment, narrow_environment=narrow_environment)
    df_csp = df[df['CSP'] == csp].copy()
    
    selected_app_codes = [code.strip() for code in app_codes.split(',')]
    
    df_filtered = df_csp[df_csp['AppCode'].isin(selected_app_codes)]
    
    if df_filtered.empty:
        return {"monthly_trend": [], "monthly_heatmap": [], "app_codes": selected_app_codes}

    df_filtered['Month'] = pd.to_datetime(df_filtered['tCreated']).dt.strftime('%Y-%m')
    months_order = sorted(df_filtered['Month'].unique())

    # 1. Monthly Trend data (Line chart)
    monthly_trend_df = df_filtered.groupby('Month').size().reset_index(name='count')
    monthly_trend_df = monthly_trend_df.set_index('Month').reindex(months_order, fill_value=0).reset_index()
    monthly_trend_data = monthly_trend_df.to_dict(orient='records')

    # 2. Monthly Heatmap data
    monthly_heatmap_df = df_filtered.groupby(['Month', 'AppCode']).size().unstack(fill_value=0)
    monthly_heatmap_df = monthly_heatmap_df.reindex(months_order, fill_value=0)
    monthly_heatmap_df = monthly_heatmap_df.reindex(columns=selected_app_codes, fill_value=0)
    monthly_heatmap_data = monthly_heatmap_df.reset_index().to_dict(orient='records')

    return {
        "monthly_trend": monthly_trend_data,
        "monthly_heatmap": monthly_heatmap_data,
        "app_codes": selected_app_codes
    }

@app.get("/api/reports/total-ticket-count-by-appcode")
def get_total_ticket_count_by_appcode(year: int, csp: str, environment: Optional[str] = None, narrow_environment: Optional[str] = None):
    df_full = get_data(year, environment, narrow_environment)
    df_filtered = df_full[df_full['CSP'] == csp]

    if df_filtered.empty:
        return {}

    # Group by AppCode and count tickets
    total_counts = df_filtered.groupby('AppCode').size()

    return total_counts.to_dict()

@app.get("/api/download_tickets")
def download_tickets(
    sortField: str,
    sortOrder: str,
    filters: Optional[str] = None,
    global_year: int = 2024,
    global_environment: str = "All",
    global_narrow_environment: str = "All",
    visibleColumns: Optional[str] = None
):
    df_full = get_data(global_year, global_environment, global_narrow_environment)

    # Filtering
    query_parts = []
    if filters:
        filter_list = filters.split(',')
        for f in filter_list:
            if ':' in f:
                col, val = f.split(':', 1)
                if col in df_full.columns:
                    query_parts.append(f'`{col}`.str.contains("{val}", case=False, na=False)')

    if query_parts:
        df_filtered = df_full.query(' and '.join(query_parts))
    else:
        df_filtered = df_full

    # Sorting
    if sortField and sortField in df_filtered.columns:
        df_sorted = df_filtered.sort_values(by=sortField, ascending=(sortOrder == 'asc'))
    else:
        df_sorted = df_filtered

    # Column Selection
    if visibleColumns:
        cols_to_show = visibleColumns.split(',')
        # Ensure all requested columns exist in the dataframe
        cols_to_show_exist = [col for col in cols_to_show if col in df_sorted.columns]
        final_df = df_sorted[cols_to_show_exist]
    else:
        final_df = df_sorted

    # Generate CSV
    output = StringIO()
    final_df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=tickets.csv"})


@app.get("/api/download_tickets")
def download_tickets(
    sortField: Optional[str] = None,
    sortOrder: Optional[str] = None,
    filters: Optional[str] = None,
    global_year: Optional[int] = None,
    global_environment: Optional[str] = None,
    global_narrow_environment: Optional[str] = None,
    visibleColumns: Optional[str] = None
):
    # Start with the full dataset, applying global filters first
    df = get_data(global_year, global_environment, global_narrow_environment)

    # Apply column-specific filters from the table UI
    if filters:
        query_parts = []
        filter_list = filters.split(',')
        for f in filter_list:
            if ':' in f:
                col, val = f.split(':', 1)
                if col in df.columns and val:
                    query_parts.append(f'`{col}`.str.contains("{val}", case=False, na=False)')
        
        if query_parts:
            df = df.query(' and '.join(query_parts))

    # Sorting
    if sortField and sortField in df.columns:
        df = df.sort_values(by=sortField, ascending=(sortOrder == 'asc'))

    # Column Selection
    final_df = df
    if visibleColumns:
        cols_to_show = visibleColumns.split(',')
        # Ensure all requested columns exist in the dataframe before selection
        cols_to_show_exist = [col for col in cols_to_show if col in df.columns]
        if cols_to_show_exist:
            final_df = df[cols_to_show_exist]

    # Generate CSV
    output = StringIO()
    final_df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=tickets.csv"})


@app.get("/api/reports/control-count-by-appcode")
async def get_control_count_by_appcode(year: int, csp: str, environment: Optional[str] = None, narrow_environment: Optional[str] = None):
    df = get_data(year, environment, narrow_environment)
    df_csp = df[df['CSP'] == csp]
    
    grouped = df_csp.groupby(['AppCode', 'ConfigRule']).size().reset_index(name='count')
    
    pivot_df = grouped.pivot(index='AppCode', columns='ConfigRule', values='count').fillna(0).astype(int)
    
    config_rules = sorted(df_csp['ConfigRule'].unique().tolist())
    
    # Ensure all config rules are present in the columns
    pivot_df = pivot_df.reindex(columns=config_rules, fill_value=0)
    
    chart_data = pivot_df.reset_index().to_dict(orient='records')
    
    return {
        "data": chart_data,
        "config_rules": config_rules
    }

@app.get("/api/reports/heatmap")
async def get_heatmap_data(year: int, csp: str, environment: Optional[str] = None, narrow_environment: Optional[str] = None):
    df = get_data(year, environment, narrow_environment)
    df_csp = df[df['CSP'] == csp]
    
    heatmap_df = pd.crosstab(df_csp['AppCode'], df_csp['ConfigRule'])
    
    app_codes = sorted(heatmap_df.index.tolist())
    config_rules = sorted(heatmap_df.columns.tolist())
    
    heatmap_data = heatmap_df.values.tolist()
    
    return {
        "data": heatmap_data,
        "app_codes": app_codes,
        "config_rules": config_rules
    }

@app.get("/api/configrule-heartbeat")
async def get_configrule_heartbeat(csp: str, environment: Optional[str] = None, narrow_environment: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    logger.info(f"--- Starting /api/configrule-heartbeat (csp: {csp}) ---")
    try:
        if csp.lower() == 'aws':
            df = aws_heartbeat_df.copy()
        elif csp.lower() == 'gcp':
            df = gcp_heartbeat_df.copy()
        else:
            return JSONResponse(status_code=400, content={"detail": "Invalid CSP specified."})

        if df.empty:
            logger.warning(f"Heartbeat data for {csp} is empty.")
            return {}

        df['tCreated'] = pd.to_datetime(df['tCreated'])

        # Date filtering logic
        if start_date and end_date:
            try:
                start = pd.to_datetime(start_date)
                end = pd.to_datetime(end_date)
                df = df[(df['tCreated'] >= start) & (df['tCreated'] <= end)]
            except ValueError:
                return JSONResponse(status_code=400, content={"detail": "Invalid date format."})
        else:
            # Default to last 7 days
            end = pd.to_datetime('today')
            start = end - pd.Timedelta(days=7)
            df = df[(df['tCreated'] >= start) & (df['tCreated'] <= end)]

        # Environment filters
        if environment and environment != 'All':
            df = df[df['Environment'] == environment]
        if narrow_environment and narrow_environment != 'All':
            df = df[df['NarrowEnvironment'] == narrow_environment]

        if df.empty:
            logger.warning(f"No heartbeat data for {csp} after filtering.")
            return {}

        df['Date'] = df['tCreated'].dt.strftime('%Y-%m-%d')

        summary = df.groupby(['ConfigRule', 'Date']).size().reset_index(name='count')
        pivot_df = summary.pivot_table(index='Date', columns='ConfigRule', values='count').fillna(0)

        # Determine the date range from the request or default
        if start_date and end_date:
            request_start_date = pd.to_datetime(start_date)
            request_end_date = pd.to_datetime(end_date)
        else:
            request_end_date = pd.to_datetime('today')
            request_start_date = request_end_date - pd.Timedelta(days=7)

        # Ensure all days in the requested range are present in the pivot table
        all_days_in_range = pd.date_range(start=request_start_date, end=request_end_date, freq='D').strftime('%Y-%m-%d')
        pivot_df = pivot_df.reindex(all_days_in_range, fill_value=0)

        pivot_df.sort_index(inplace=True)

        result = {}
        for rule in pivot_df.columns:
            rule_data = pivot_df[[rule]].reset_index()
            rule_data.columns = ['month', 'count'] # Keep 'month' for frontend compatibility
            result[rule] = rule_data.to_dict('records')

        return result
    except Exception as e:
        logger.error(f"Error in configrule heartbeat for {csp}: {e}", exc_info=True)
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": "Failed to determine status."})

@app.post("/api/chatbot")
def chatbot_response(request: dict):
    agent = request.get("agent", "aws").upper()
    query = request.get("query", "")

    responses = [
        {"type": "text", "content": f"This is a mock response from the {agent} agent to your query: '{query}'."},
    ]

    if "image" in query.lower():
        responses.append({
            "type": "image", 
            "content": "https://source.unsplash.com/random/400x300?cloud,technology",
            "alt": "A random cloud technology image"
        })

    return {"responses": responses}

@app.get("/api/heartbeat-status")
def get_heartbeat_status(csp: str, year: Optional[int] = None, environment: Optional[str] = None, narrow_environment: Optional[str] = None):
    """Endpoint to get heartbeat ticket status for line graphs."""
    if csp.lower() == 'aws':
        df = aws_heartbeat_df.copy()
    elif csp.lower() == 'gcp':
        df = gcp_heartbeat_df.copy()
    else:
        return {"error": "Invalid CSP specified"}

    if df.empty:
        return {"dates": [], "success": [], "failed": []}

    # Note: Heartbeat data is not affected by environment filters, but we keep the params for consistency
    if year:
        df = df[df['tCreated'].dt.year == year]

    df['Date'] = df['tCreated'].dt.date
    # Derive status from the Summary field
    df['Status'] = df['Summary'].apply(lambda x: 'Success' if 'Success' in str(x) else 'Failed')
    status_counts = df.groupby(['Date', 'Status']).size().unstack(fill_value=0)
    
    if 'Success' not in status_counts:
        status_counts['Success'] = 0
    if 'Failed' not in status_counts:
        status_counts['Failed'] = 0

    status_counts = status_counts.reset_index()
    status_counts['Date'] = pd.to_datetime(status_counts['Date']).dt.strftime('%Y-%m-%d')

    return {
        "dates": status_counts['Date'].tolist(),
        "success": status_counts['Success'].tolist(),
        "failed": status_counts['Failed'].tolist(),
    }



