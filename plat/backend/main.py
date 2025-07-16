import pandas as pd
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from faker import Faker
import random

app = FastAPI()
fake = Faker()

# Allow requests from the React frontend
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

@app.get("/api/confluence/page-tree")
async def get_confluence_page_tree():
    return confluence_page_tree

@app.get("/api/confluence/page/{page_id}")
async def get_confluence_page(page_id: str):
    return {"html_content": confluence_pages.get(page_id, "<h1>Page Not Found</h1>")}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust if your frontend runs on a different port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_ticket_data():
    """Generates a mock DataFrame of ticket information."""
    statuses = ['Open', 'In Progress', 'Closed']
    priorities = ['Low', 'Medium', 'High']
    applications = ['application1', 'application2', 'application3']
    data = {
        'id': [i for i in range(1, 201)],
        'subject': [fake.sentence(nb_words=6) for _ in range(200)],
        'status': [random.choice(statuses) for _ in range(200)],
        'priority': [random.choice(priorities) for _ in range(200)],
        'created_at': [fake.date_time_this_year() for _ in range(200)],
        'application': [random.choice(applications) for _ in range(200)],
    }
    return pd.DataFrame(data)

tickets_df = create_ticket_data()

@app.get("/api/tickets")
def get_tickets(page: int = 1, size: int = 25, sort_by: str = 'id', sort_order: str = 'asc'):
    """Endpoint to get a paginated list of tickets."""
    sorted_df = tickets_df.sort_values(by=sort_by, ascending=(sort_order == 'asc'))
    
    start = (page - 1) * size
    end = start + size
    paginated_tickets = sorted_df.iloc[start:end]
    
    return {
        "tickets": paginated_tickets.to_dict(orient='records'),
        "total": len(tickets_df)
    }

@app.get("/api/tickets-summary")
def get_tickets_summary():
    """Endpoint to get a summary of tickets by status for charting."""
    summary = tickets_df['status'].value_counts().reset_index()
    summary.columns = ['status', 'count']
    return summary.to_dict(orient='records')

@app.get("/api/tickets-by-priority")
def get_tickets_by_priority():
    """Endpoint to get ticket counts grouped by application and priority for a heatmap."""
    heatmap_data = tickets_df.groupby(['application', 'priority']).size().reset_index(name='count')
    return heatmap_data.to_dict(orient='records')

@app.get("/api/tickets-by-application")
def get_tickets_by_application():
    """Endpoint to get ticket counts grouped by application and status."""
    summary = tickets_df.groupby(['application', 'status']).size().unstack(fill_value=0).reset_index()
    return summary.to_dict(orient='records')

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

@app.get("/api/tickets/download")
def download_tickets_csv():
    """Endpoint to download all tickets as a CSV file."""
    csv_data = tickets_df.to_csv(index=False)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tickets.csv"}
    )

@app.get("/api/tickets-by-application")
def get_tickets_by_application():
    """Endpoint to get ticket counts grouped by application and status."""
    summary = tickets_df.groupby(['application', 'status']).size().unstack(fill_value=0).reset_index()
    return summary.to_dict(orient='records')
