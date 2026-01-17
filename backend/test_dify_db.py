from sqlalchemy import create_engine, text

engine = create_engine('postgresql+psycopg2://postgres:difyai123456@localhost:5434/dify')
conn = engine.connect()
result = conn.execute(text('SELECT id, name, mode, status FROM apps'))
print('Apps:')
for row in result:
    print(f'  {row[0]}: {row[1]} ({row[2]}) - {row[3]}')
conn.close()
print('\n连接成功！')
