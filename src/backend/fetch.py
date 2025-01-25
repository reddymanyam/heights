import frappe

@frappe.whitelist()
def get_all_custom_tasks(user=None): 
    tasks = []

    # If user is provided, filter by user
    if user:
        tasks = frappe.db.sql("""
            SELECT 
                task.*,
                user_child.user_link AS assigned_to_users,
                list_of_task.task_nme AS list_of_task
            FROM 
                `tabTask` AS task
            LEFT JOIN 
                `tabUser Child` AS user_child ON user_child.parent = task.name
            LEFT JOIN 
                `tabList of Task` AS list_of_task ON list_of_task.parent = task.name
            WHERE
                task.custom_task = 1
                AND user_child.user_link = %s
        """, (user,), as_dict=True)
    else:
        tasks = frappe.db.sql("""
            SELECT 
                task.*,
                user_child.user_link AS assigned_to_users,
                list_of_task.task_nme AS list_of_task
            FROM 
                `tabTask` AS task
            LEFT JOIN 
                `tabUser Child` AS user_child ON user_child.parent = task.name
            LEFT JOIN 
                `tabList of Task` AS list_of_task ON list_of_task.parent = task.name
            WHERE
                task.custom_task = 1
        """, as_dict=True)

    # Grouping child records into their respective keys
    result = []
    for task in tasks:
        task_record = next((item for item in result if item['name'] == task['name']), None)
        
        if not task_record:
            task_record = {
                **task,
                'assigned_to_users': [],
                'list_of_task': []
            }
            result.append(task_record)

        if task['assigned_to_users'] and task['assigned_to_users'] not in task_record['assigned_to_users']:
            task_record['assigned_to_users'].append(task['assigned_to_users'])

        if task['list_of_task'] and task['list_of_task'] not in task_record['list_of_task']:
            task_record['list_of_task'].append(task['list_of_task'])

    return result

@frappe.whitelist()
def add_custom_task(data):
    # Fetch the existing task or create a new one
    task = frappe.get_doc("Task", data.get("name")) if frappe.db.exists("Task", data.get("name")) else frappe.new_doc("Task")
    
    task.subject = data.get("subject")
    task.custom_task = data.get("custom_task")
    task.exp_end_date = data.get("exp_end_date")
    task.exp_start_date = data.get("exp_start_date")
    task.priority = data.get("priority")
    task.project = data.get("project")
    task.status = data.get("status")
    task.assigned_to_users = []
    task.parent_task = data.get("parent_task")
    
    # Handle assignment of users
    for user in data.get("assigned_to_users", []):
        child = task.append("assigned_to_users", {})
        child.user_link = user
    
    task.save()
    return task.as_dict()  # Returning the saved task as a dictionary
