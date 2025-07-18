import pandas as pd

def split_ticket_data():
    """Reads the combined ticket data, splits it by CSP, and saves to separate CSV files."""
    try:
        # Load the original data
        df = pd.read_csv('ticket_data.csv')

        # Filter for AWS and GCP
        aws_df = df[df['CSP'] == 'AWS']
        gcp_df = df[df['CSP'] == 'GCP']

        # Save to new CSV files
        aws_df.to_csv('aws_ticket_data.csv', index=False)
        gcp_df.to_csv('gcp_ticket_data.csv', index=False)

        print("Successfully split ticket_data.csv into aws_ticket_data.csv and gcp_ticket_data.csv")

    except FileNotFoundError:
        print("Error: ticket_data.csv not found. Make sure the script is in the same directory.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    split_ticket_data()
