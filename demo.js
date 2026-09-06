const fs = require('fs');

async function runDemo() {
  const baseUrl = 'http://localhost:3000';
  let token = '';
  let projectId = '';
  const email = `demo_${Date.now()}@example.com`;

  console.log('🚀 Starting Axionix API Demo...\n');

  // 1. Register User
  console.log(`[1] Registering a new user: ${email}`);
  let res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Demo User', email, password: 'password123' }),
  });
  let data = await res.json();
  console.log('Response:', data);
  console.log('');

  // 2. Login User
  console.log(`[2] Logging in as ${email}`);
  res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  data = await res.json();
  token = data.token;
  console.log('Response: { token: "***" }');
  console.log('');

  // 3. Create Project
  console.log('[3] Creating a new project');
  res = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Internship Tracker', description: 'Backend API tasks' }),
  });
  data = await res.json();
  projectId = data.data.id;
  console.log('Response:', data);
  console.log('');

  // 4. Create Tasks
  console.log(`[4] Creating tasks in Project #${projectId}`);
  const tasks = [
    { title: 'Setup DB schema', priority: 'HIGH', due_date: new Date().toISOString() },
    { title: 'Write Auth Routes', priority: 'MEDIUM', due_date: new Date().toISOString() },
    { title: 'Create Demo', priority: 'LOW', due_date: new Date().toISOString() }
  ];
  
  for (const t of tasks) {
    res = await fetch(`${baseUrl}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(t),
    });
    data = await res.json();
    console.log(`Created Task: ${data.data.title}`);
  }
  console.log('');

  // 5. Update a Task Status
  console.log('[5] Setting first task to DONE');
  res = await fetch(`${baseUrl}/projects/${projectId}/tasks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const taskList = await res.json();
  const firstTaskId = taskList.data[0].id;

  res = await fetch(`${baseUrl}/tasks/${firstTaskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'DONE' }),
  });
  data = await res.json();
  console.log('Response:', data);
  console.log('');

  // 6. Fetch Project Summary
  console.log('[6] Fetching Project Summary');
  res = await fetch(`${baseUrl}/projects/${projectId}/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log('');

  console.log('✅ Demo complete!');
}

runDemo().catch(console.error);
