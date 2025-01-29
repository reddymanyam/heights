import React, { useState, useEffect } from 'react';
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

  // Fetch Projects
  const { data: projects, mutate: mutateProjects } = useFrappeGetDocList('Project', {
    fields: ['name', 'project_name', 'status', 'expected_start_date', 'expected_end_date']
  });

  // Fetch Tasks for each project
  const { data: tasks } = useFrappeGetDocList('Task', {
    fields: ['name', 'subject', 'status', 'priority', 'exp_start_date', 'exp_end_date', '_assign', 'project'],
  });

  // Fetch Users for assignee options
  const { data: users } = useFrappeGetDocList('User', {
    fields: ['name', 'full_name'],
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
          assignedTo: task._assign ? JSON.parse(task._assign) : [],
        }))
    }));
  }, [projects, tasks]);

  const assigneeOptions = React.useMemo(() => {
    return [...new Set(users?.map(user => user.full_name))] || [];
}, [users]);

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
        _assign: JSON.stringify(newSubtask.assignedTo)
      });
       
      mutateProjects();
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
        _assign: JSON.stringify(editingValues.assignedTo)
      });

      mutateProjects();
      setEditingSubtask(null);
      setEditingValues({});
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteSubtask = async (projectId, subtaskId) => {
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
                    <TableCell sx={{display:"flex", justifyContent:"flex-end"}}>
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
                                          size="small"
                                          fullWidth
                                        >
                                          {assigneeOptions.map(person => (
                                            <MenuItem key={person} value={person}>
                                              {person}
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
                                        size="small"
                                        fullWidth
                                      >
                                        {assigneeOptions.map(person => (
                                          <MenuItem key={person} value={person}>
                                            {person}
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