// filters for tasks..............
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, IconButton, Box, Typography, Select, MenuItem, Tabs, Tab, Drawer, Chip, List, ListItem, Avatar, FormControl, InputLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import Navbar from '../../shared/navbar/Navbar';
import General from './General';
import { useFrappeGetDocList, useFrappeCreateDoc, useFrappeDeleteDoc, useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
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


export default function Heights() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState({});
  const [editingSubtask, setEditingSubtask] = useState(null);
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
  //subtasks section end.......................

  const [newProject, setNewProject] = useState({ project: '', subtasks: [] });
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    startDate: '',
    endDate: '',
    status: '',
    priority: '',
    assignedTo: [],
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
  const { deleteDoc: deleteTask } = useFrappeDeleteDoc();

  const transformedProjects = React.useMemo(() => {
    if (!projects || !tasks) return [];

    return projects.map(project => ({
      id: project.name,
      project: project.project_name,
      subtasks: tasks?.message?.filter(task => task.project === project.name)?.map(task => ({
        id: task.name,
        title: task.subject,
        startDate: task.exp_start_date,
        endDate: task.exp_end_date,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assigned_to_users ? task.assigned_to_users : [],
        project_name: task.project
      }))
    }));
  }, [projects, tasks]);

  const filteredProjects = React.useMemo(() => {
    if (!transformedProjects) return [];

    return transformedProjects.map(project => ({
      ...project,
      subtasks: project.subtasks.filter(subtask => {
        const matchesStatus = !statusFilter || subtask.status === statusFilter;
        const matchesPriority = !priorityFilter || subtask.priority === priorityFilter;
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
  };

  const handleToggleSubtasks = (projectId) => {
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
      setNewProject({ project: '', subtasks: [] });
      setShowAddProject(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleAddSubtask = async (projectId) => {
    if (!newSubtask.title.trim()) return;

    try {
      const projectData = projects.find(p => p.name === projectId);

      await updateTask({
        data: {
          project: projectId,
          project_name: projectData?.project_name || '',
          subject: newSubtask.title,
          status: newSubtask.status,
          priority: newSubtask.priority,
          exp_start_date: newSubtask.startDate,
          exp_end_date: newSubtask.endDate,
          assigned_to_users: newSubtask.assignedTo,
          custom_task: 1,
        }
      });


      await Promise.all([mutateProjects(), mutateTasks()]);
      setNewSubtask({
        title: '',
        startDate: '',
        endDate: '',
        status: '',
        priority: '',
        assignedTo: [],
        custom_task: 1
      });
      setShowAddSubtask(prev => ({ ...prev, [projectId]: false }));
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };


  const handleEditSubtask = (projectId, subtaskId) => {
    // Find the subtask in the project's subtasks array
    const project = transformedProjects.find(p => p.id === projectId);
    const subtask = project?.subtasks.find(t => t.id === subtaskId);

    if (subtask) {
      setEditingSubtask({ projectId, subtaskId: subtask.id });
      setEditingValues({
        title: subtask.title,
        startDate: subtask.startDate,
        endDate: subtask.endDate,
        status: subtask.status,
        priority: subtask.priority,
        assignedTo: subtask.assignedTo || [],
      });
    }
  };

  const handleUpdate = async (projectId, subtaskId) => {
    try {
      const projectData = projects.find(p => p.name === projectId);

      await updateTask({
        data: {
          name: subtaskId,
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

      await Promise.all([mutateProjects(), mutateTasks()]);
      setEditingSubtask(null);
      setEditingValues({});
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteSubtask = async (projectId, subtaskId) => {
    try {
      await deleteTask('Task', subtaskId);
      await Promise.all([mutateProjects(), mutateTasks()]);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingSubtask(null);
    setEditingValues({});
  };

  const isEditing = (projectId, subtaskId) =>
    editingSubtask?.projectId === projectId && editingSubtask?.subtaskId === subtaskId;

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
                      <TableCell>
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
                            onClick={() => handleToggleSubtasks(project.id)}
                          >
                            <span>{project.project}</span>
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <span style={{ marginRight: 8 }}>
                                {expandedProjectId === project.id ? '▲' : '▼'}
                              </span>
                              <Typography sx={{ fontSize: '0.85em' }}>
                                Tasks: {project.subtasks.length}
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
                              {project.subtasks.length !== 0 && (
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ border: 'none', fontWeight: 500 }}>Task</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 500 }}>Start Date</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 500 }}>End Date</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 500 }}>Status</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 500 }}>Priority</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 500 }}>Assigned To</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 500 }}>Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                              )}
                              <TableBody>
                                {project.subtasks.length === 0 && !showAddSubtask[project.id] ? (
                                  <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <Typography color="text.secondary">
                                        No tasks available for this project
                                      </Typography>
                                      <Button
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowAddSubtask(prev => ({ ...prev, [project.id]: true }))}
                                        sx={{ padding: "4px 14px" }}
                                      >
                                        Add Task
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  <>
                                    {project.subtasks.map(subtask => (
                                      <TableRow key={subtask.id} sx={{ bgcolor: 'background.paper', borderRadius:1, '&:hover':{ bgcolor:'action.hover' } }}>
                                        <TableCell onClick={() => handleTaskClick(subtask)} sx={{ cursor: "pointer", border: 'none' }} >
                                          {isEditing(project.id, subtask.id) ? (
                                            <TextField
                                              value={editingValues.title}
                                              onChange={(e) => handleEditChange('title', e.target.value)}
                                              size="small"
                                              fullWidth
                                            />
                                          ) : subtask.title}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                          {isEditing(project.id, subtask.id) ? (
                                            <TextField
                                              type="date"
                                              value={editingValues.startDate}
                                              onChange={(e) => handleEditChange('startDate', e.target.value)}
                                              size="small"
                                              fullWidth
                                              InputLabelProps={{ shrink: true }}
                                              sx={{ border: 'none' }}
                                            />
                                          ) : subtask.startDate}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                          {isEditing(project.id, subtask.id) ? (
                                            <TextField
                                              type="date"
                                              value={editingValues.endDate}
                                              onChange={(e) => handleEditChange('endDate', e.target.value)}
                                              size="small"
                                              fullWidth
                                              InputLabelProps={{ shrink: true }}
                                              sx={{ border: 'none' }}
                                            />
                                          ) : subtask.endDate}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                          {isEditing(project.id, subtask.id) ? (
                                            <Select
                                              value={editingValues.status}
                                              onChange={(e) => handleEditChange('status', e.target.value)}
                                              size="small"
                                              fullWidth
                                              sx={{ border: 'none' }}
                                            >
                                              {statusOptions.map(status => (
                                                <MenuItem key={status} value={status}>
                                                  {status}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          ) : (
                                            <Chip
                                              label={subtask.status}
                                              size="small"
                                              sx={{ ...getStatusStyle(subtask.status) }}
                                            />
                                          )}
                                        </TableCell>

                                        <TableCell sx={{ border: 'none' }}>
                                          {isEditing(project.id, subtask.id) ? (
                                            <Select
                                              value={editingValues.priority}
                                              onChange={(e) => handleEditChange('priority', e.target.value)}
                                              size="small"
                                              fullWidth
                                              sx={{ border: 'none' }}
                                            >
                                              {priorityOptions.map(priority => (
                                                <MenuItem key={priority} value={priority}>
                                                  {priority}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          ) : (
                                            <Chip
                                              label={subtask.priority}
                                              size="small"
                                              sx={{ ...getPriorityStyle(subtask.priority) }}
                                            />
                                          )}
                                        </TableCell>

                                        <TableCell sx={{ maxWidth: 150, border: 'none' }}>
                                          {isEditing(project.id, subtask.id) ? (
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
                                            <EmailAvatars emails={subtask.assignedTo} />
                                          )}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                          {isEditing(project.id, subtask.id) ? (
                                            <>
                                              <IconButton onClick={() => handleUpdate(project.id, subtask.id)}>
                                                <CheckIcon sx={{ color: "green" }} />
                                              </IconButton>
                                              <IconButton onClick={handleCancelEdit}>
                                                <CloseIcon sx={{ color: "red" }} />
                                              </IconButton>
                                            </>
                                          ) : (
                                            <>
                                              <IconButton onClick={() => handleEditSubtask(project.id, subtask.id)}>
                                                <EditIcon sx={{ color: "green" }} />
                                              </IconButton>
                                              <IconButton onClick={() => handleDeleteSubtask(project.id, subtask.id)}>
                                                <DeleteIcon sx={{ color: "red" }} />
                                              </IconButton>
                                            </>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </>
                                )}

                                {showAddSubtask[project.id] && (
                                  <TableRow>
                                    <TableCell>
                                      <TextField
                                        value={newSubtask.title}
                                        onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        placeholder="Enter subtask name"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            handleAddSubtask(project.id, subtaskId);
                                          }
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        type="date"
                                        value={newSubtask.startDate}
                                        onChange={(e) => setNewSubtask(prev => ({ ...prev, startDate: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        type="date"
                                        value={newSubtask.endDate}
                                        onChange={(e) => setNewSubtask(prev => ({ ...prev, endDate: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={newSubtask.status}
                                        onChange={(e) => setNewSubtask(prev => ({ ...prev, status: e.target.value }))}
                                        size="small"
                                        fullWidth
                                      >
                                        {statusOptions.map(status => (
                                          <MenuItem key={status} value={status}>
                                            {status}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={newSubtask.priority}
                                        onChange={(e) => setNewSubtask(prev => ({ ...prev, priority: e.target.value }))}
                                        size="small"
                                        fullWidth
                                      >
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
                                        value={newSubtask.assignedTo}
                                        onChange={(e) => setNewSubtask(prev => ({ ...prev, assignedTo: e.target.value }))}
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
                                      <IconButton onClick={() => handleAddSubtask(project.id)}>
                                        <CheckIcon sx={{ color: "green" }} />
                                      </IconButton>
                                      <IconButton onClick={() => setShowAddSubtask(prev => ({ ...prev, [project.id]: false }))}>
                                        <CloseIcon sx={{ color: "red" }} />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                )}

                                {!showAddSubtask[project.id] && project.subtasks.length > 0 && (
                                  <TableRow>
                                    <TableCell colSpan={7}>
                                      <Button
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowAddSubtask(prev => ({ ...prev, [project.id]: true }))}
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
            <General getStatusStyle={getStatusStyle} getPriorityStyle={getPriorityStyle} />
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
        />
      </Box>
    </>
  );
}