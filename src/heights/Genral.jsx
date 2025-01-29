import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, IconButton, Typography, Select, MenuItem, Collapse, Box, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useFrappeGetDocList, useFrappeDeleteDoc, useFrappePostCall } from 'frappe-react-sdk';
import Cookies from 'js-cookie';

const statusOptions = ['Open', 'Working', 'Pending Review', 'Overdue', 'Completed', 'Cancelled'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

export default function General({ getStatusStyle, getPriorityStyle }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingValues, setEditingValues] = useState({});
  const [tasks, setTasks] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);
  const [showAddSubtask, setShowAddSubtask] = useState(null);
  const [editingSubtask, setEditingSubtask] = useState(null);

  const userEmail = Cookies.get('user_id');

  const [newTask, setNewTask] = useState({
    title: '',
    startDate: '',
    endDate: '',
    status: 'Open',
    priority: 'Medium',
    assignedTo: [userEmail],
    custom_task: true,
    subtasks: []
  });

  const [newSubtask, setNewSubtask] = useState({
    title: '',
    startDate: '',
    endDate: '',
    status: 'Open',
    priority: 'Medium',
    assignedTo: [userEmail]
  });

  // API calls setup
  const { call: fetchTasks } = useFrappePostCall('novelite_us.novelite_us.api.Land_Acquisitions.tasksList.fetch.get_all_custom_tasks');
  const { call: addUpdateTask } = useFrappePostCall('novelite_us.novelite_us.api.Land_Acquisitions.tasksList.fetch.add_custom_task');
  const { deleteDoc } = useFrappeDeleteDoc();

  // Fetch tasks
  const loadTasks = async () => {
    try {
      const response = await fetchTasks({ user: userEmail });
      const userTasks = response.message.filter(task =>
        task.assigned_to_users === userEmail ||
        (Array.isArray(task.assigned_to_users) && task.assigned_to_users.includes(userEmail))
      );
      setTasks(userTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    if (userEmail) {
      loadTasks();
    }
  }, [userEmail]);

  // Fetch Users for assignee options
  const { data: users } = useFrappeGetDocList('User', {
    fields: ['email'],
    limit: 1000,
  });

  const filteredAssigneeOptions = React.useMemo(() => {
    return users
      ?.filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(user => user.email) || [];
  }, [users, searchTerm]);

  const transformedTasks = React.useMemo(() => {
    return tasks.map(task => ({
      id: task.name,
      project: task.project,
      title: task.subject,
      startDate: task.exp_start_date,
      endDate: task.exp_end_date,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assigned_to_users ? task.assigned_to_users : [],
      subtasks: task.subtasks || []
    }));
  }, [tasks]);

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      await addUpdateTask({
        data: {
          subject: newTask.title,
          status: newTask.status,
          priority: newTask.priority,
          exp_start_date: newTask.startDate,
          exp_end_date: newTask.endDate,
          assigned_to_users: newTask.assignedTo,
          custom_task: 1
        }
      });

      await loadTasks();

      setNewTask({
        title: '',
        startDate: '',
        endDate: '',
        status: 'Open',
        priority: 'Medium',
        assignedTo: [userEmail],
        subtasks: []
      });
      setShowAddTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleAddSubtask = async (parentTaskId) => {
    if (!newSubtask.title.trim()) return;

    try {
      // For now, create dummy data
      const subtaskId = `subtask-${Date.now()}`;
      const newSubtaskData = {
        id: subtaskId,
        title: newSubtask.title,
        startDate: newSubtask.startDate,
        endDate: newSubtask.endDate,
        status: newSubtask.status,
        priority: newSubtask.priority,
        assignedTo: newSubtask.assignedTo
      };

      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.name === parentTaskId) {
            return {
              ...task,
              subtasks: [...(task.subtasks || []), newSubtaskData]
            };
          }
          return task;
        })
      );

      setNewSubtask({
        title: '',
        startDate: '',
        endDate: '',
        status: 'Open',
        priority: 'Medium',
        assignedTo: [userEmail]
      });
      setShowAddSubtask(null);
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task.id);
    setEditingValues({
      ...task,
      assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]
    });
  };

  const handleEditSubtask = async (taskId, subtaskId, updatedData) => {
    try {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.name === taskId) {
            return {
              ...task,
              subtasks: (task.subtasks || []).map(subtask =>
                subtask.id === subtaskId ? { ...subtask, ...updatedData } : subtask
              )
            };
          }
          return task;
        })
      );
      setEditingSubtask(null);
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleSaveEdit = async (taskId) => {
    try {
      await addUpdateTask({
        data: {
          name: taskId,
          project: editingValues.project,
          subject: editingValues.title,
          status: editingValues.status,
          priority: editingValues.priority,
          exp_start_date: editingValues.startDate,
          exp_end_date: editingValues.endDate,
          assigned_to_users: editingValues.assignedTo,
          custom_task: 1
        }
      });

      await loadTasks();
      setEditingTask(null);
      setEditingValues({});
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc('Task', taskId);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDeleteSubtask = async (taskId, subtaskId) => {
    try {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.name === taskId) {
            return {
              ...task,
              subtasks: (task.subtasks || []).filter(subtask => subtask.id !== subtaskId)
            };
          }
          return task;
        })
      );
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditingValues({});
  };

  const handleEditChange = (field, value) => {
    setEditingValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // SubtaskRow Component
  const SubtaskRow = ({ taskId, subtask }) => {
    const isEditing = editingSubtask === subtask.id;
    const [editValues, setEditValues] = useState(subtask);

    const handleEditChange = (field, value) => {
      setEditValues(prev => ({
        ...prev,
        [field]: value
      }));
    };

    return (
      <TableRow>
        <TableCell>
          {isEditing ? (
            <TextField
              value={editValues.title}
              onChange={(e) => handleEditChange('title', e.target.value)}
              size="small"
              fullWidth
            />
          ) : subtask.title}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              type="date"
              value={editValues.startDate}
              onChange={(e) => handleEditChange('startDate', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          ) : subtask.startDate}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              type="date"
              value={editValues.endDate}
              onChange={(e) => handleEditChange('endDate', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          ) : subtask.endDate}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Select
              value={editValues.status}
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
          ) : (
            <Chip
              label={subtask.status}
              size="small"
              sx={{ ...getStatusStyle(subtask.status) }}
            />
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Select
              value={editValues.priority}
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
          ) : (
            <Chip
              label={subtask.priority}
              size="small"
              sx={{ ...getPriorityStyle(subtask.priority) }}
            />
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Select
              multiple
              value={editValues.assignedTo}
              onChange={(e) => handleEditChange('assignedTo', e.target.value)}
              renderValue={(selected) => selected.join(', ')}
              size="small"
              fullWidth
            >
              {filteredAssigneeOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          ) : subtask.assignedTo.join(', ')}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <>
              <IconButton onClick={() => handleEditSubtask(taskId, subtask.id, editValues)}>
                <CheckIcon sx={{ color: "green" }} />
              </IconButton>
              <IconButton onClick={() => setEditingSubtask(null)}>
                <CloseIcon sx={{ color: "red" }} />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton onClick={() => setEditingSubtask(subtask.id)}>
                <EditIcon sx={{ color: "green" }} />
              </IconButton>
              <IconButton onClick={() => handleDeleteSubtask(taskId, subtask.id)}>
                <DeleteIcon sx={{ color: "red" }} />
              </IconButton>
            </>
          )}
        </TableCell>
      </TableRow>
    );
  };

  // TaskRow Component
  const TaskRow = ({ task }) => {
    const isEditing = editingTask === task.id;

    return (
      <>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
            >
              {expandedTask === task.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            {isEditing ? (
              <TextField
                value={editingValues.title}
                onChange={(e) => handleEditChange('title', e.target.value)}
                size="small"
                fullWidth
              />
            ) : task.title}
          </Box>
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              type="date"
              value={editingValues.startDate}
              onChange={(e) => handleEditChange('startDate', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          ) : task.startDate}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              type="date"
              value={editingValues.endDate}
              onChange={(e) => handleEditChange('endDate', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          ) : task.endDate}
        </TableCell>
        <TableCell>
          {isEditing ? (
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
          ) : (
            <Chip
              label={task.status}
              size="small"
              sx={{ ...getStatusStyle(task.status) }}
            />
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
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
          ) : (
            <Chip
              label={task.priority}
              size="small"
              sx={{ ...getPriorityStyle(task.priority) }}
            />
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
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
          ) : task.assignedTo.join(', ')}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <>
              <IconButton onClick={() => handleSaveEdit(task.id)}>
                <CheckIcon sx={{ color: "green" }} />
              </IconButton>
              <IconButton onClick={handleCancelEdit}>
                <CloseIcon sx={{ color: "red" }} />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton onClick={() => handleEditTask(task)}>
                <EditIcon sx={{ color: "green" }} />
              </IconButton>
              <IconButton onClick={() => handleDeleteTask(task.id)}>
                <DeleteIcon sx={{ color: "red" }} />
              </IconButton>
            </>
          )}
        </TableCell>
      </>
    );
  };

  if (!userEmail || userEmail === 'Guest') {
    return (
      <TableContainer component={Paper} sx={{ marginTop: 1 }}>
        <Typography align="center" sx={{ p: 2 }}>
          Please log in to view your tasks
        </Typography>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: "16px", fontWeight: 500 }}>Tasks</TableCell>
            <TableCell sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowAddTask(!showAddTask)}
                sx={{ p: '2px 6px' }}
              >
                Add Task
              </Button>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {showAddTask && (
            <TableRow>
              <TableCell colSpan={2}>
                <Table size="small">
                  <TableBody>
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
                              handleAddTask();
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
                          value={newTask.priority}
                          onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
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
                          value={newTask.assignedTo}
                          onChange={(e) => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                          renderValue={(selected) => selected.join(', ')}
                          size="small"
                          fullWidth
                        >
                          {filteredAssigneeOptions.map(option => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={handleAddTask}>
                          <CheckIcon sx={{ color: "green" }} />
                        </IconButton>
                        <IconButton onClick={() => setShowAddTask(false)}>
                          <CloseIcon sx={{ color: "red" }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableCell>
            </TableRow>
          )}

          {transformedTasks.length === 0 && !showAddTask ? (
            <TableRow>
              <TableCell colSpan={2} align="center">
                <Typography color="text.secondary">
                  No tasks available
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
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
                    {transformedTasks.map(task => (
                      <React.Fragment key={task.id}>
                        <TableRow>
                          <TaskRow task={task} />
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={7} style={{ paddingBottom: 0, paddingTop: 0 }}>
                            <Collapse in={expandedTask === task.id} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="h6" gutterBottom component="div">
                                    Subtasks
                                  </Typography>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => setShowAddSubtask(task.id)}
                                  >
                                    Add Subtask
                                  </Button>
                                </Box>
                                {showAddSubtask === task.id && (
                                  <Table size="small">
                                    <TableBody>
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
                                                handleAddSubtask(task.id);
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
                                            {filteredAssigneeOptions.map(option => (
                                              <MenuItem key={option} value={option}>
                                                {option}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </TableCell>
                                        <TableCell>
                                          <IconButton onClick={() => handleAddSubtask(task.id)}>
                                            <CheckIcon sx={{ color: "green" }} />
                                          </IconButton>
                                          <IconButton onClick={() => setShowAddSubtask(null)}>
                                            <CloseIcon sx={{ color: "red" }} />
                                          </IconButton>
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                )}

                                <Table size="small">
                                  <TableBody>
                                    {task.subtasks && task.subtasks.map(subtask => (
                                      <SubtaskRow
                                        key={subtask.id}
                                        taskId={task.id}
                                        subtask={subtask}
                                      />
                                    ))}
                                    {(!task.subtasks || task.subtasks.length === 0) && (
                                      <TableRow>
                                        <TableCell colSpan={7} align="center">
                                          <Typography color="text.secondary">
                                            No subtasks available
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}