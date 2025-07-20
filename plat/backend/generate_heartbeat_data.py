import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_heartbeat_data():
    """Generates heartbeat ticket data for AWS and GCP to monitor pipeline health."""
    
    end_date = datetime.now()
    start_date = datetime(2024, 6, 1)
    
    timestamps = list(pd.to_datetime(np.arange(start_date, end_date, timedelta(hours=2))))

    def create_dataset(csp, rules, key_prefix):
        data = []
        for i, ts in enumerate(timestamps):
            is_success = np.random.rand() > 0.05
            
            if is_success:
                summary_status = 'Success'
                resolved_ts = ts + timedelta(minutes=np.random.randint(5, 30))
                time_to_resolve = resolved_ts - ts
            else:
                summary_status = 'Failed'
                resolved_ts = pd.NaT
                time_to_resolve = pd.NaT

            data.append({
                'CSP': csp,
                'Environment': 'PROD',
                'NarrowEnvironment': 'Prod',
                'AlertType': 'Heartbeat',
                'Priority': 'Critical',
                'Key': f'{key_prefix}-{i+1}',
                'AppCode': 'MONITOR',
                'ConfigRule': np.random.choice(rules),
                'Summary': f'Heartbeat Check - {summary_status}',
                'Account': str(np.random.randint(10**11, 10**12 - 1)),
                'tCreated': ts,
                'tResolved': resolved_ts,
                'TimeToResolve': time_to_resolve
            })
        return pd.DataFrame(data)

    # --- Generate AWS Heartbeat Data ---
    aws_df = create_dataset('AWS', ['AWS-999', 'AWS-998'], 'HB-AWS')
    aws_df.to_csv('aws_heartbeat_ticket_data.csv', index=False, date_format='%Y-%m-%dT%H:%M:%S.%f%z')
    print("Successfully generated aws_heartbeat_ticket_data.csv")

    # --- Generate GCP Heartbeat Data ---
    gcp_df = create_dataset('GCP', ['GCP-111', 'GCP-112'], 'HB-GCP')
    gcp_df.to_csv('gcp_heartbeat_ticket_data.csv', index=False, date_format='%Y-%m-%dT%H:%M:%S.%f%z')
    print("Successfully generated gcp_heartbeat_ticket_data.csv")

if __name__ == "__main__":
    generate_heartbeat_data()
