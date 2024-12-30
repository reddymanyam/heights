import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, IconButton, Box, Typography, Select, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Navbar from '../../shared/navbar/Navbar';
import { useTheme } from '@mui/material/styles';

const statusOptions = ['Open', 'Working', 'Pending Review', 'Overdue', 'Completed', 'Cancelled'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];
const assigneeOptions = ['John Doe', 'Jane Smith', 'Michael Brown'];

const initialProjects = [
  {
    id: 1,
    project: 'Website Redesign',
    subtasks: [
      {
        id: 1,
        title: 'Design homepage',
        startDate: '2024-01-10',
        endDate: '2024-02-15',
        status: 'Open',
        priority: 'Medium',
        assignedTo: ['John Doe']
      },
      {
        id: 2,
        title: 'Implement navigation bar',
        startDate: '2024-01-15',
        endDate: '2024-02-01',
        status: 'Working',
        priority: 'High',
        assignedTo: ['Jane Smith']
      }
    ]
  },
  {
    id: 2,
    project: 'Mobile App Development',
    subtasks: [
      {
        id: 1,
        title: 'Define app features',
        startDate: '2024-03-01',
        endDate: '2024-03-15',
        status: 'Open',
        priority: 'High',
        assignedTo: ['Michael Brown']
      }
    ]
  }
];

export default function Heights() {
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [projects, setProjects] = useState(initialProjects);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState({});
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [editingValues, setEditingValues] = useState({});

  const [newProject, setNewProject] = useState({
    project: '',
    subtasks: []
  });

  const [newSubtask, setNewSubtask] = useState({
    title: '',
    startDate: '',
    endDate: '',
    status: '',
    priority: '',
    assignedTo: []
  });

  const theme = useTheme();

  // Add validation helper function
  const validateDates = (startDate, endDate) => {
    if (!startDate || !endDate) return true; // Allow empty dates
    return new Date(endDate) >= new Date(startDate);
  };

  const handleToggleSubtasks = (projectId) => {
    setExpandedProjectId(prev => prev === projectId ? null : projectId);
  };

  const handleAddProject = () => {
    if (!newProject.project.trim()) return;
    
    const updatedProjects = [
      ...projects,
      { ...newProject, id: projects.length + 1 }
    ];
    setProjects(updatedProjects);
    setNewProject({ project: '', subtasks: [] });
    setShowAddProject(false);
  };

  const handleAddSubtask = (projectId) => {
    if (!newSubtask.title.trim()) return;

    // Validate dates before adding
    if (newSubtask.startDate && newSubtask.endDate) {
      if (!validateDates(newSubtask.startDate, newSubtask.endDate)) {
        alert('End date cannot be earlier than start date');
        return;
      }
    }

    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === projectId
          ? {
            ...project,
            subtasks: [
              ...project.subtasks,
              {
                ...newSubtask,
                id: project.subtasks.length + 1
              }
            ]
          }
          : project
      )
    );

    setNewSubtask({
      title: '',
      startDate: '',
      endDate: '',
      status: '',
      priority: '',
      assignedTo: []
    });
    setShowAddSubtask(prev => ({ ...prev, [projectId]: false }));
  };

  const handleEditSubtask = (projectId, subtask) => {
    setEditingSubtask({ projectId, subtaskId: subtask.id });
    setEditingValues(subtask);
  };

  const handleSaveEdit = (projectId, subtaskId) => {
    // Validate dates before saving
    if (!validateDates(editingValues.startDate, editingValues.endDate)) {
      alert('End date cannot be earlier than start date');
      return;
    }

    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === projectId
          ? {
            ...project,
            subtasks: project.subtasks.map(subtask =>
              subtask.id === subtaskId
                ? { ...editingValues }
                : subtask
            )
          }
          : project
      )
    );

    setEditingSubtask(null);
    setEditingValues({});
  };


  const handleCancelEdit = () => {
    setEditingSubtask(null);
    setEditingValues({});
  };

  const handleDeleteSubtask = (projectId, subtaskId) => {
    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === projectId
          ? {
            ...project,
            subtasks: project.subtasks.filter(subtask => subtask.id !== subtaskId)
          }
          : project
      )
    );
  };

  const isEditing = (projectId, subtaskId) =>
    editingSubtask?.projectId === projectId && editingSubtask?.subtaskId === subtaskId;

  const handleEditChange = (field, value) => {
    const newValues = {
      ...editingValues,
      [field]: value
    };

    // Validate dates when either start or end date changes
    if (field === 'startDate' || field === 'endDate') {
      const isValid = validateDates(
        field === 'startDate' ? value : editingValues.startDate,
        field === 'endDate' ? value : editingValues.endDate
      );

      if (!isValid) {
        alert('End date cannot be earlier than start date');
        return;
      }
    }

    setEditingValues(newValues);
  };

  return (
    <>
      <Box m={2}>
        <Navbar title="Tasks" />
        <TableContainer component={Paper} sx={{ marginTop: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddProject(!showAddProject)}
            >
              Add Project
            </Button>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Project</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
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

              {projects.map(project => (
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

                            {/* Add Subtask section */}
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
                                <TableCell colSpan={5}></TableCell>
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
      </Box>
    </>
  );
}