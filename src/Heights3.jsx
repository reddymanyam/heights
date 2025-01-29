import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, IconButton, Box, Typography, Select, MenuItem, Tabs, Tab } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Navbar from '../../shared/navbar/Navbar';
import General from './General';
import { useFrappeGetDocList, useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeDeleteDoc } from 'frappe-react-sdk';

const statusOptions = ['Open', 'Working', 'Pending Review', 'Overdue', 'Completed', 'Cancelled'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

export default function Heights() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState(''); //search term for the assigner value
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState({});
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [editingValues, setEditingValues] = useState({});
  const [newProject, setNewProject] = useState({ project: '', subtasks: [] });
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    startDate: '',
    endDate: '',
    status: '',
    priority: '',
    assignedTo: []
  });

  // Fetch Projects and Tasks with mutate functions
  const { data: projects, mutate: mutateProjects } = useFrappeGetDocList('Project', {
    fields: ['name', 'project_name', 'status', 'expected_start_date', 'expected_end_date']
  });

  const { data: tasks, mutate: mutateTasks } = useFrappeGetDocList('Task', {
    fields: ['name', 'subject', 'status', 'priority', 'exp_start_date', 'exp_end_date', 'assign_to', 'project'],
    limit: 1000,
  });

  // Fetch Users for assignee options
  const { data: users } = useFrappeGetDocList('User', {
    fields: ['email'],
    limit: 1000,
  });


  // Create mutations
  const { createDoc: createProject } = useFrappeCreateDoc();
  const { createDoc: createTask } = useFrappeCreateDoc();
  const { updateDoc: updateTask } = useFrappeUpdateDoc();
  const { deleteDoc: deleteTask } = useFrappeDeleteDoc();

  // Transform data for UI
  const transformedProjects = React.useMemo(() => {
    if (!projects || !tasks) return [];

    return projects.map(project => ({
      id: project.name,
      project: project.project_name,
      subtasks: tasks
        .filter(task => task.project === project.name)
        .map(task => ({
          id: task.name,
          title: task.subject,
          startDate: task.exp_start_date,
          endDate: task.exp_end_date,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assign_to ? [task.assign_to] : [],
        }))
    }));
  }, [projects, tasks]);

  const filteredAssigneeOptions = React.useMemo(() => {
    return users
      ?.filter(user =>
        `$(${user.email})`.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(user => `${user.email}`) || [];
  }, [users, searchTerm]);

  // Handle tab change
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
      await createTask('Task', {
        project: projectId,
        subject: newSubtask.title,
        status: newSubtask.status,
        priority: newSubtask.priority,
        exp_start_date: newSubtask.startDate,
        exp_end_date: newSubtask.endDate,
        assign_to: newSubtask.assignedTo[0] || '' // Send first assignee only if exists
      });

      // Refetch both projects and tasks data
      await Promise.all([
        mutateProjects(),
        mutateTasks()
      ]);

      setNewSubtask({
        title: '',
        startDate: '',
        endDate: '',
        status: '',
        priority: '',
        assignedTo: []
      });
      setShowAddSubtask(prev => ({ ...prev, [projectId]: false }));
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleEditSubtask = (projectId, subtask) => {
    setEditingSubtask({ projectId, subtaskId: subtask.id });
    setEditingValues(subtask);
  };

  const handleSaveEdit = async (projectId, subtaskId) => {
    try {
      await updateTask('Task', subtaskId, {
        subject: editingValues.title,
        status: editingValues.status,
        priority: editingValues.priority,
        exp_start_date: editingValues.startDate,
        exp_end_date: editingValues.endDate,
        assign_to: editingValues.assignedTo[0] || '' // Send first assignee only if exists
      });

      // Refetch both projects and tasks data
      await Promise.all([
        mutateProjects(),
        mutateTasks()
      ]);

      setEditingSubtask(null);
      setEditingValues({});
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteSubtask = async (projectId, subtaskId) => {
    console.log('Deleting subtask:', subtaskId); // Add this for debugging
    try {
      await deleteTask('Task', subtaskId);
      mutateProjects();
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

  // Validation helper
  const validateDates = (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    return new Date(endDate) >= new Date(startDate);
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

        <Box>
          {activeTab === 0 && (
            <TableContainer component={Paper} sx={{ marginTop: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: "16px", fontWeight: 500 }}>Projects</TableCell>
                    <TableCell sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddProject(!showAddProject)}
                        sx={{ p: '4px 8px' }}
                      >
                        Add Project
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {showAddProject && (
                    <TableRow>
                      <TableCell>
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
                        <Button variant="contained" onClick={handleAddProject} sx={{ mr: 1 }}>
                          Save
                        </Button>
                        <Button onClick={() => setShowAddProject(false)}>
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}

                  {transformedProjects.map(project => (
                    <React.Fragment key={project.id}>
                      <TableRow>
                        <TableCell>
                          <Typography
                            onClick={() => handleToggleSubtasks(project.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            {project.project} {expandedProjectId === project.id ? '▲' : '▼'}
                          </Typography>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>

                      {expandedProjectId === project.id && (
                        <TableRow>
                          <TableCell colSpan={2}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Task</TableCell>
                                  <TableCell>Start Date</TableCell>
                                  <TableCell>End Date</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Priority</TableCell>
                                  <TableCell>Assigned To</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {project.subtasks.map(subtask => (
                                  <TableRow key={subtask.id}>
                                    <TableCell>
                                      {isEditing(project.id, subtask.id) ? (
                                        <TextField
                                          value={editingValues.title}
                                          onChange={(e) => handleEditChange('title', e.target.value)}
                                          size="small"
                                          fullWidth
                                        />
                                      ) : subtask.title}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing(project.id, subtask.id) ? (
                                        <TextField
                                          type="date"
                                          value={editingValues.startDate}
                                          onChange={(e) => handleEditChange('startDate', e.target.value)}
                                          size="small"
                                          fullWidth
                                          InputLabelProps={{ shrink: true }}
                                        />
                                      ) : subtask.startDate}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing(project.id, subtask.id) ? (
                                        <TextField
                                          type="date"
                                          value={editingValues.endDate}
                                          onChange={(e) => handleEditChange('endDate', e.target.value)}
                                          size="small"
                                          fullWidth
                                          InputLabelProps={{ shrink: true }}
                                        />
                                      ) : subtask.endDate}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing(project.id, subtask.id) ? (
                                        <Select
                                          value={editingValues.status}
                                          onChange={(e) => handleEditChange('status', e.target.value)}
                                          size="small"
                                          fullWidth
                                        >
                                          {statusOptions.map(status => (
                                            <MenuItem key={status} value={status}>
                                              {status}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      ) : subtask.status}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing(project.id, subtask.id) ? (
                                        <Select
                                          value={editingValues.priority}
                                          onChange={(e) => handleEditChange('priority', e.target.value)}
                                          size="small"
                                          fullWidth
                                        >
                                          {priorityOptions.map(priority => (
                                            <MenuItem key={priority} value={priority}>
                                              {priority}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      ) : subtask.priority}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing(project.id, subtask.id) ? (
                                        <Select
                                          multiple
                                          value={editingValues.assignedTo}
                                          onChange={(e) => handleEditChange('assignedTo', e.target.value)}
                                          renderValue={(selected) => selected.join(', ')}
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
                                      ) : subtask.assignedTo.join(', ')}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing(project.id, subtask.id) ? (
                                        <>
                                          <IconButton onClick={() => handleSaveEdit(project.id, subtask.id)}>
                                            <CheckIcon sx={{ color: "green" }} />
                                          </IconButton>
                                          <IconButton onClick={handleCancelEdit}>
                                            <CloseIcon sx={{ color: "red" }} />
                                          </IconButton>
                                        </>
                                      ) : (
                                        <>
                                          <IconButton onClick={() => handleEditSubtask(project.id, subtask)}>
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

                                {showAddSubtask[project.id] ? (
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
                                            handleAddSubtask(project.id);
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
                                          renderValue={(selected) => selected.join(', ')}
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
                                ) : (
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
            <General />
          )}
        </Box>
      </Box>
    </>
  );
}