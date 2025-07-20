import pandas as pd
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import logging
import atc

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

# Include the ATC router to make its endpoints available
app.include_router(atc.router, prefix="/api/atc", tags=["atc"])

tickets_df = None
aws_heartbeat_df = None
gcp_heartbeat_df = None

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
    except FileNotFoundError as e:
        print(f"Error: Heartbeat file {e.filename} not found. Heartbeat monitoring will be disabled.")
        aws_heartbeat_df = pd.DataFrame()
        gcp_heartbeat_df = pd.DataFrame()

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

        aws_monthly_avg = round(aws_total / 12, 1) if aws_total > 0 else 0
        gcp_monthly_avg = round(gcp_total / 12, 1) if gcp_total > 0 else 0

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
        "app_codes": app_codes
    }

@app.get("/api/reports/control-count-by-appcode")
async def get_control_count_by_appcode(year: int, csp: str, environment: Optional[str] = None, narrow_environment: Optional[str] = None):
    df = get_data(year, environment, narrow_environment)
    df_csp = df[df['CSP'] == csp]
    
    grouped = df_csp.groupby(['AppCode', 'ConfigRule']).size().reset_index(name='count')
    
    pivot_df = grouped.pivot(index='AppCode', columns='ConfigRule', values='count').fillna(0).astype(int)
    
    config_rules = sorted(df_csp['ConfigRule'].unique().tolist())
    
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
async def get_configrule_heartbeat(csp: str, year: Optional[int] = None, environment: Optional[str] = None, narrow_environment: Optional[str] = None):
    logger.info(f"--- Starting /api/configrule-heartbeat (csp: {csp}, year: {year}) ---")
    try:
        # Select the correct heartbeat dataframe based on the CSP
        if csp.lower() == 'aws':
            df = aws_heartbeat_df.copy()
        elif csp.lower() == 'gcp':
            df = gcp_heartbeat_df.copy()
        else:
            return JSONResponse(status_code=400, content={"detail": "Invalid CSP specified."})

        if df.empty:
            logger.warning(f"Heartbeat data for {csp} is empty.")
            return {}

        # Apply filters
        if year:
            df = df[df['tCreated'].dt.year == year]
        if environment and environment != 'All':
            df = df[df['Environment'] == environment]
        if narrow_environment and narrow_environment != 'All':
            df = df[df['NarrowEnvironment'] == narrow_environment]

        if df.empty:
            logger.warning(f"No heartbeat data for {csp} after filtering.")
            return {}

        df['Month'] = df['tCreated'].dt.to_period('M').astype(str)

        summary = df.groupby(['ConfigRule', 'Month']).size().reset_index(name='count')
        
        pivot_df = summary.pivot_table(index='Month', columns='ConfigRule', values='count').fillna(0)

        if year:
            all_months_in_year = pd.period_range(start=f'{year}-01', end=f'{year}-12', freq='M').strftime('%Y-%m')
            pivot_df = pivot_df.reindex(all_months_in_year, fill_value=0)

        pivot_df.sort_index(inplace=True)

        result = {}
        for rule in pivot_df.columns:
            rule_data = pivot_df[[rule]].reset_index()
            rule_data.columns = ['month', 'count']
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


@app.get("/api/tickets/download")
def download_tickets_csv(
    year: Optional[int] = None,
    environment: Optional[str] = None,
    narrow_environment: Optional[str] = None,
    Key: Optional[str] = None,
    Summary: Optional[str] = None,
    Priority: Optional[str] = None,
    CSP: Optional[str] = None,
    AppCode: Optional[str] = None,
    AlertType: Optional[str] = None,
    ConfigRule: Optional[str] = None,
    Account: Optional[str] = None
):
    """Endpoint to download tickets as a CSV file, with optional filtering."""
    df = get_data(year, environment, narrow_environment)

    # Apply column-specific filters
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
    if AlertType:
        df = df[df['AlertType'].str.contains(AlertType, case=False, na=False)]
    if ConfigRule:
        df = df[df['ConfigRule'].str.contains(ConfigRule, case=False, na=False)]
    if Account:
        df = df[df['Account'].str.contains(Account, case=False, na=False)]

    csv_data = df.to_csv(index=False)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tickets.csv"}
    )
