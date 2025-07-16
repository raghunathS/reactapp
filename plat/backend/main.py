import pandas as pd
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from faker import Faker
import random

app = FastAPI()
fake = Faker()

# Allow requests from the React frontend
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
    data = {
        'id': [i for i in range(1, 201)],
        'subject': [fake.sentence(nb_words=6) for _ in range(200)],
        'status': [random.choice(statuses) for _ in range(200)],
        'priority': [random.choice(priorities) for _ in range(200)],
        'created_at': [fake.date_time_this_year() for _ in range(200)],
    }
    return pd.DataFrame(data)

tickets_df = create_ticket_data()

@app.get("/api/tickets")
def get_tickets(page: int = 1, size: int = 25):
    """Endpoint to get a paginated list of tickets."""
    start = (page - 1) * size
    end = start + size
    paginated_tickets = tickets_df.iloc[start:end]
    
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

@app.get("/api/tickets/download")
def download_tickets_csv():
    """Endpoint to download all tickets as a CSV file."""
    csv_data = tickets_df.to_csv(index=False)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tickets.csv"}
    )
