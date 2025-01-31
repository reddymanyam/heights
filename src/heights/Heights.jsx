// filters for tasks..............
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, IconButton, Box, Typography, Select, MenuItem, Tabs, Tab, Drawer, Chip, List, ListItem, Avatar, FormControl, InputLabel, styled } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import Navbar from '../../shared/navbar/Navbar';
import General from './General';
import { useFrappeGetDocList, useFrappeCreateDoc, useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import EmailAvatars from './EmailAvatars';
import SubtaskDrawer from './SubtaskDrawer';

const statusOptions = ['Open', 'Working', 'Pending Review', 'Overdue', 'Completed', 'Cancelled'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

const getStatusStyle = (status) => {
  switch (status) {
    case 'Open':
      return { backgroundColor: '#FFD700', color: 'black' };
    case 'Working':
      return { backgroundColor: '#FF8C00', color: 'white' };
    case 'Pending Review':
      return { backgroundColor: '#C71585', color: 'white' };
    case 'Overdue':
      return { backgroundColor: 'red', color: 'white' };
    case 'Completed':
      return { backgroundColor: 'green', color: 'white' };
    case 'Cancelled':
      return { backgroundColor: 'gray', color: 'white' };
    default:
      return { backgroundColor: 'black', color: 'white' };
  }
};

const getPriorityStyle = (priority) => {
  switch (priority) {
    case 'Low':
      return { backgroundColor: 'lightgreen', color: 'black' };
    case 'Medium':
      return { backgroundColor: '#20B2AA', color: 'white' };
    case 'High':
      return { backgroundColor: 'orange', color: 'black' };
    case 'Urgent':
      return { backgroundColor: 'red', color: 'white' };
    default:
      return { backgroundColor: 'black', color: 'white' };
  }
};

const CustomTableCell = styled(TableCell)(({ theme }) => ({   //created this to remove the duplicate styling of table cell
  border: 'none',
  fontWeight: 500,
}));

export default function Heights() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [editingValues, setEditingValues] = useState({});

  //state for filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  //subtasks section start.......................
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const [newProject, setNewProject] = useState({ project: '', tasks: [] });
  const [newTask, setNewTask] = useState({
    title: '',
    startDate: '',
    endDate: '',
    status: '',
    priority: '',
    assignedTo: [],
    description: '',
    custom_task: 1
  });

  const { data: projects, mutate: mutateProjects } = useFrappeGetDocList('Project', {
    fields: ['name', 'project_name', 'status', 'expected_start_date', 'expected_end_date']
  });

  const { data: users } = useFrappeGetDocList('User', {
    fields: ['email'],
    filters: [['enabled', '=', 1]],
    limit: 1000,
  });

  const { createDoc: createProject } = useFrappeCreateDoc();
  const { data: tasks, mutate: mutateTasks } = useFrappeGetCall('novelite_us.novelite_us.api.Land_Acquisitions.tasksList.fetch.get_all_custom_tasks');
  const { call: updateTask } = useFrappePostCall('novelite_us.novelite_us.api.Land_Acquisitions.tasksList.fetch.add_custom_task');
  const { call: deleteTask } = useFrappePostCall('novelite_us.novelite_us.api.Land_Acquisitions.tasksList.delete_task.delete_task?task_id=TASK - 003355');

  // ------------------------------------------------------ Subtasks Section Start ------------------------------------------------------
  const createSubtask = async (subtaskData) => {
    try {
      const result = await updateTask({
        data: {
          ...subtaskData,
          custom_task: 1
        }
      });

      // Refresh tasks
      await mutateTasks();

      return result;
    } catch (error) {
      console.error('Error creating subtask:', error);
      throw error;
    }
  };

  const updateSubtask = async (subtaskId, updatedData) => {
    try {
      const result = await updateTask({
        data: {
          ...updatedData,
          name: subtaskId,
          custom_task: 1
        }
      });

      // Refresh tasks
      await mutateTasks();

      return result;
    } catch (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
  };

  const deleteSubtask = async (subtaskId) => {
    try {
      await deleteTask({ task_id: subtaskId });

      // Refresh tasks
      await mutateTasks();
    } catch (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    }
  };

  // Method to fetch subtasks for a specific task
  const fetchSubtasksForTask = (parentTaskId) => {
    if (!tasks || !tasks.message) return [];

    return tasks.message.filter(task =>
      task.parent_task === parentTaskId && task.custom_task === 1
    );
  };

  //------------------------------------------------------ Subtasks Section End ------------------------------------------------------

  let parentTasks = [];

  if (tasks) {
    //Parent Tasks filtering
    parentTasks = tasks.message.filter((task) => {
      return task.parent_task === "" || task.parent_task === null;
    });
  }

  const transformedProjects = React.useMemo(() => {
    if (!projects || !tasks) return [];

    return projects.map(project => ({
      id: project.name,
      project: project.project_name,
      tasks: [
        // First, add parent tasks for this project
        ...(tasks?.message?.filter(task =>
          (task.parent_task === "" || task.parent_task === null) &&
          task.project === project.name
        )?.map(task => ({
          id: task.name,
          title: task.subject,
          startDate: task.exp_start_date,
          endDate: task.exp_end_date,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assigned_to_users ? task.assigned_to_users : [],
          project_name: task.project,
          description: task.description,
          isParentTask: true // Add a flag to distinguish parent tasks
        })) || []),

      ]
    }));
  }, [projects, tasks]);
  // console.log(tasks,'tasks');


  const filteredProjects = React.useMemo(() => {
    if (!transformedProjects) return [];

    return transformedProjects.map(project => ({
      ...project,
      tasks: project.tasks.filter(task => {
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;
        return matchesStatus && matchesPriority;
      })
    }));
  }, [transformedProjects, statusFilter, priorityFilter]);

  // Add filter reset function
  const resetFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
  };

  const filteredAssigneeOptions = React.useMemo(() => {
    return users
      ?.filter(user => `${user.email}`.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(user => `${user.email}`) || [];
  }, [users, searchTerm]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    mutateTasks();
  };

  const handleToggleTasks = (projectId) => {
    setExpandedProjectId(prev => prev === projectId ? null : projectId);
  };

  const handleAddProject = async () => {
    if (!newProject.project.trim()) return;

    try {
      await createProject('Project', {
        project_name: newProject.project,
        lot_price: 0,
        lot_area: 0,
        company: 'Novel Office',
        naming_series: 'PROJ-.####',
      });

      mutateProjects();
      setNewProject({ project: '', tasks: [] });
      setShowAddProject(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleAddTask = async (projectId) => {
    if (!newTask.title.trim()) return;

    try {
      const projectData = projects.find(p => p.name === projectId);

      await updateTask({
        data: {
          project: projectId,
          project_name: projectData?.project_name || '',
          subject: newTask.title,
          status: newTask.status,
          priority: newTask.priority,
          exp_start_date: newTask.startDate,
          exp_end_date: newTask.endDate,
          assigned_to_users: newTask.assignedTo,
          custom_task: 1,
        }
      });


      await Promise.all([mutateProjects(), mutateTasks()]);  //promise.all is used to run the different promises at the same time parallelly

      setNewTask({
        title: '',
        startDate: '',
        endDate: '',
        status: '',
        priority: '',
        assignedTo: [],
        custom_task: 1
      });
      setShowAddTask(prev => ({ ...prev, [projectId]: false }));
      toast.success('Task added successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to add task!');
    }
  };


  const handleEditTask = (projectId, taskId) => {
    // Find the task in the project's tasks array
    const project = transformedProjects.find(p => p.id === projectId);
    const task = project?.tasks.find(t => t.id === taskId);

    if (task) {
      setEditingTask({ projectId, taskId: task.id });
      setEditingValues({
        title: task.title,
        startDate: task.startDate,
        endDate: task.endDate,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || [],
      });
    }
  };

  const handleUpdate = async (projectId, taskId) => {
    try {
      const projectData = projects.find(p => p.name === projectId);

      await updateTask({
        data: {
          name: taskId,
          project: projectId,
          project_name: projectData?.project_name || '',
          subject: editingValues.title,
          status: editingValues.status,
          priority: editingValues.priority,
          exp_start_date: editingValues.startDate,
          exp_end_date: editingValues.endDate,
          assigned_to_users: editingValues.assignedTo,
          custom_task: 1,
        }
      });

      // console.log('Task updated successfully',taskId,projectId,projectData?.project_name,editingValues.title,editingValues.status,editingValues.priority,editingValues.startDate,editingValues.endDate,editingValues.assignedTo);


      await Promise.all([mutateProjects(), mutateTasks()]);
      setEditingTask(null);
      setEditingValues({});
      toast.success('Task updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task!');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask({ task_id: taskId });
      await mutateTasks();
      toast.success('Task deleted successfully!');
    }
    catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task!');
      throw error;
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditingValues({});
  };

  const isEditing = (projectId, taskId) =>
    editingTask?.projectId === projectId && editingTask?.taskId === taskId;

  const handleEditChange = (field, value) => {
    setEditingValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <Box m={2}>
        <Navbar title="Tasks" />
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Projects" />
          <Tab label="General" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "contained" : "outlined"}
              size="small"
            >
              Filters
            </Button>

            {showFilters && (
              <>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    {statusOptions.map(status => (
                      <MenuItem key={status} value={status}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', ...getStatusStyle(status) }} />
                          {status}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    label="Priority"
                  >
                    <MenuItem value="">All</MenuItem>
                    {priorityOptions.map(priority => (
                      <MenuItem key={priority} value={priority}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', ...getPriorityStyle(priority) }} />
                          {priority}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {(statusFilter || priorityFilter) && (
                  <Button
                    size="small"
                    onClick={resetFilters}
                    variant="outlined"
                    color="secondary"
                  >
                    Clear Filters
                  </Button>
                )}
              </>
            )}
          </Box>
        )}

        <Box>
          {activeTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: "16px", fontWeight: 500, border: 'none' }}>Projects</TableCell>
                    <TableCell sx={{ display: "flex", justifyContent: "flex-end", border: 'none' }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddProject(!showAddProject)}
                        sx={{ p: '2px 6px' }}
                      >
                        Add Project
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {showAddProject && (
                    <TableRow>
                      <TableCell sx={{ border: 'none' }}>
                        <TextField
                          label="Project Name"
                          fullWidth
                          value={newProject.project}
                          onChange={(e) => setNewProject(prev => ({ ...prev, project: e.target.value }))}
                          size="small"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddProject();
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <Button variant="contained" onClick={handleAddProject} sx={{ mr: 1, border: 'none' }}>
                          Save
                        </Button>
                        <Button onClick={() => setShowAddProject(false)}>
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}

                  {filteredProjects.map(project => (
                    <React.Fragment key={project.id}>
                      <TableRow>
                        <TableCell sx={{ border: 'none' }}>
                          <Typography
                            component="div"
                            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: 'pointer', width: "100%" }}
                            onClick={() => handleToggleTasks(project.id)}
                          >
                            <span>{project.project}</span>
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <span style={{ marginRight: 8 }}>
                                {expandedProjectId === project.id ? '▲' : '▼'}
                              </span>
                              <Typography sx={{ fontSize: '0.85em' }}>
                                Tasks: {project.tasks.length}
                              </Typography>
                            </div>
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ border: 'none' }}></TableCell>
                      </TableRow>

                      {expandedProjectId === project.id && (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ border: 'none', padding: '0 16px' }}>
                            <Table size="small">
                              {project.tasks.length !== 0 && (
                                <TableHead>
                                  <TableRow>
                                    {['Task', 'Start Date', 'End Date', 'Status', 'Priority', 'Assigned To', 'Actions'].map((columnName) => (
                                      <CustomTableCell key={columnName}>{columnName}</CustomTableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                              )}
                              <TableBody>
                                {project.tasks.length === 0 && !showAddTask[project.id] ? (
                                  <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <Typography color="text.secondary">
                                        No tasks available for this project
                                      </Typography>
                                      <Button
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowAddTask(prev => ({ ...prev, [project.id]: true }))}
                                        sx={{ padding: "4px 14px" }}
                                      >
                                        Add Task
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  <>
                                    {project.tasks.map(task => (
                                      <TableRow key={task.id} sx={{ bgcolor: 'background.paper', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                                        <TableCell onClick={() => handleTaskClick(task)} sx={{ cursor: "pointer", border: 'none' }} >
                                          {isEditing(project.id, task.id) ? (
                                            <TextField
                                              value={editingValues.title}
                                              onChange={(e) => handleEditChange('title', e.target.value)}
                                              size="small"
                                              fullWidth
                                            />
                                          ) : task.title}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                          {isEditing(project.id, task.id) ? (
                                            <TextField
                                              type="date"
                                              value={editingValues.startDate}
                                              onChange={(e) => handleEditChange('startDate', e.target.value)}
                                              size="small"
                                              fullWidth
                                              InputLabelProps={{ shrink: true }}
                                              sx={{ border: 'none' }}
                                            />
                                          ) : task.startDate}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                          {isEditing(project.id, task.id) ? (
                                            <TextField
                                              type="date"
                                              value={editingValues.endDate}
                                              onChange={(e) => handleEditChange('endDate', e.target.value)}
                                              size="small"
                                              fullWidth
                                              InputLabelProps={{ shrink: true }}
                                              sx={{ border: 'none' }}
                                            />
                                          ) : task.endDate}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                          {isEditing(project.id, task.id) ? (
                                            <Select
                                              value={editingValues.status}
                                              onChange={(e) => handleEditChange('status', e.target.value)}
                                              size="small"
                                              fullWidth
                                              sx={{ border: 'none' }}
                                            >
                                              <MenuItem value="" disabled>Status</MenuItem>
                                              {statusOptions.map(status => (
                                                <MenuItem key={status} value={status}>
                                                  {status}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          ) : (
                                            <Chip
                                              label={task.status}
                                              size="small"
                                              sx={{ ...getStatusStyle(task.status) }}
                                            />
                                          )}
                                        </TableCell>

                                        <TableCell sx={{ border: 'none' }}>
                                          {isEditing(project.id, task.id) ? (
                                            <Select
                                              value={editingValues.priority}
                                              onChange={(e) => handleEditChange('priority', e.target.value)}
                                              size="small"
                                              fullWidth
                                              sx={{ border: 'none' }}
                                            >
                                              <MenuItem value="" disabled>Priority</MenuItem>
                                              {priorityOptions.map(priority => (
                                                <MenuItem key={priority} value={priority}>
                                                  {priority}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          ) : (
                                            <Chip
                                              label={task.priority}
                                              size="small"
                                              sx={{ ...getPriorityStyle(task.priority) }}
                                            />
                                          )}
                                        </TableCell>

                                        <TableCell sx={{ maxWidth: 150, border: 'none' }}>
                                          {isEditing(project.id, task.id) ? (
                                            <Select
                                              multiple
                                              value={editingValues.assignedTo}
                                              onChange={(e) => handleEditChange('assignedTo', e.target.value)}
                                              renderValue={(selected) => <EmailAvatars emails={selected} />}
                                              size="small"
                                              fullWidth
                                              sx={{ border: 'none' }}
                                            >
                                              <MenuItem>
                                                <TextField
                                                  placeholder="Search user..."
                                                  value={searchTerm}
                                                  onChange={(e) => setSearchTerm(e.target.value)}
                                                  size="small"
                                                  fullWidth
                                                />
                                              </MenuItem>
                                              {filteredAssigneeOptions.map(option => (
                                                <MenuItem key={option} value={option}>
                                                  {option}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          ) : (
                                            <EmailAvatars emails={task.assignedTo} />
                                          )}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                          {isEditing(project.id, task.id) ? (
                                            <>
                                              <IconButton onClick={() => handleUpdate(project.id, task.id)}>
                                                <CheckIcon sx={{ color: "green" }} />
                                              </IconButton>
                                              <IconButton onClick={handleCancelEdit}>
                                                <CloseIcon sx={{ color: "red" }} />
                                              </IconButton>
                                            </>
                                          ) : (
                                            <>
                                              <IconButton onClick={() => handleEditTask(project.id, task.id)}>
                                                <EditIcon sx={{ color: "green" }} />
                                              </IconButton>
                                              <IconButton onClick={() => handleDeleteTask(task.id)}>
                                                <DeleteIcon sx={{ color: "red" }} />
                                              </IconButton>
                                            </>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </>
                                )}

                                {showAddTask[project.id] && (
                                  <TableRow>
                                    <TableCell>
                                      <TextField
                                        value={newTask.title}
                                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        placeholder="Enter task name"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            handleAddTask(project.id, taskId);
                                          }
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        type="date"
                                        value={newTask.startDate}
                                        onChange={(e) => setNewTask(prev => ({ ...prev, startDate: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        type="date"
                                        value={newTask.endDate}
                                        onChange={(e) => setNewTask(prev => ({ ...prev, endDate: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={newTask.status}
                                        onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        displayEmpty
                                      >
                                        <MenuItem value="" disabled>Status</MenuItem>
                                        {statusOptions.map(status => (
                                          <MenuItem key={status} value={status}>
                                            {status}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        displayEmpty
                                      >
                                        <MenuItem value="" disabled>Priority</MenuItem>
                                        {priorityOptions.map(priority => (
                                          <MenuItem key={priority} value={priority}>
                                            {priority}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        multiple
                                        value={newTask.assignedTo}
                                        onChange={(e) => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                                        renderValue={(selected) => <EmailAvatars emails={selected} />}
                                        size="small"
                                        fullWidth
                                      >
                                        <MenuItem>
                                          <TextField
                                            placeholder="Search user..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            size="small"
                                            fullWidth
                                          />
                                        </MenuItem>
                                        {filteredAssigneeOptions.map(option => (
                                          <MenuItem key={option} value={option}>
                                            {option}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <IconButton onClick={() => handleAddTask(project.id)}>
                                        <CheckIcon sx={{ color: "green" }} />
                                      </IconButton>
                                      <IconButton onClick={() => setShowAddTask(prev => ({ ...prev, [project.id]: false }))}>
                                        <CloseIcon sx={{ color: "red" }} />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                )}

                                {!showAddTask[project.id] && project.tasks.length > 0 && (
                                  <TableRow>
                                    <TableCell colSpan={7}>
                                      <Button
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowAddTask(prev => ({ ...prev, [project.id]: true }))}
                                        sx={{ mt: 1 }}
                                      >
                                        Add Task
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {activeTab === 1 && (
            <General
              getStatusStyle={getStatusStyle}
              getPriorityStyle={getPriorityStyle}
              fetchSubtasks={fetchSubtasksForTask}
              createSubtask={createSubtask}
              updateSubtask={updateSubtask}
              deleteSubtask={deleteSubtask}
              selectedTask={selectedTask}
              CustomTableCell={CustomTableCell}
            />
          )}
        </Box>
        {/* Subtasks Drawer */}
        <SubtaskDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          selectedTask={selectedTask}
          users={users}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          getStatusStyle={getStatusStyle}
          getPriorityStyle={getPriorityStyle}
          fetchSubtasks={fetchSubtasksForTask}
          createSubtask={createSubtask}
          updateSubtask={updateSubtask}
          deleteSubtask={deleteSubtask}
          updateTask={updateTask}
        />

        <ToastContainer position="top-center" autoClose={1000} />  { /* toastify is used to show the toast messages*/}
      </Box>
    </>
  );
}