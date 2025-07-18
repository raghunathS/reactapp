import pandas as pd
import random
from faker import Faker
import datetime

fake = Faker()

# --- Configuration ---
NUM_RECORDS = 5000
APP_CODES = [fake.unique.lexify(text='????').upper() for _ in range(30)]
AWS_ACCOUNTS = [str(fake.unique.random_number(digits=12, fix_len=True)) for _ in range(20)]
CONFIG_RULES = [f"AWS-{fake.unique.random_number(digits=3, fix_len=True)}" for _ in range(30)]

def generate_data():
    data = []
    for i in range(NUM_RECORDS):
        csp = random.choice(['AWS', 'GCP'])
        
        # Environment and NarrowEnvironment logic
        env_choice = random.choice(['PROD', 'Non Prod', 'Uat', 'Dev', 'Unknown'])
        if env_choice == 'PROD':
            environment = 'PROD'
            narrow_environment = 'Prod'
        elif env_choice == 'Non Prod':
            environment = 'Non Prod'
            narrow_environment = random.choice(['Uat', 'Dev', 'Unknown'])
        else: # Uat, Dev, Unknown
            environment = env_choice
            narrow_environment = env_choice

        # CSP-dependent fields
        if csp == 'AWS':
            config_rule = random.choice(CONFIG_RULES)
            account = random.choice(AWS_ACCOUNTS)
        else: # GCP
            config_rule = 'Unknown'
            account = 'Unknown'

        # Timestamps
        t_created = fake.date_time_between(start_date='-1y', end_date='now', tzinfo=datetime.timezone.utc)
        resolve_delta = datetime.timedelta(hours=random.randint(1, 720))
        t_resolved = t_created + resolve_delta
        time_to_resolve = str(resolve_delta)

        record = {
            'CSP': csp,
            'Environment': environment,
            'NarrowEnvironment': narrow_environment,
            'AlertType': random.choice(['Alert', 'System', 'GuardDuty']),
            'Priority': random.choice(['High', 'Medium', 'Low', 'unknown']),
            'Key': f"CSD-{i + 10000}",
            'AppCode': random.choice(APP_CODES),
            'ConfigRule': config_rule,
            'Summary': fake.sentence(nb_words=8),
            'Account': account,
            'tCreated': t_created.isoformat(),
            'tResolved': t_resolved.isoformat(),
            'TimeToResolve': time_to_resolve
        }
        data.append(record)

    df = pd.DataFrame(data)
    df.to_csv('ticket_data.csv', index=False)
    print(f"Successfully generated {NUM_RECORDS} records to ticket_data.csv")

if __name__ == "__main__":
    generate_data()
