import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, IconButton, Typography, Select, MenuItem,
  Collapse, Box, Chip, Paper
} from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFrappeGetDocList, useFrappePostCall } from 'frappe-react-sdk';
import Cookies from 'js-cookie';
import EmailAvatars from './EmailAvatars';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

const statusOptions = ['Open', 'Working', 'Pending Review', 'Overdue', 'Completed', 'Cancelled'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

export default function General({ getStatusStyle, getPriorityStyle, createSubtask, updateSubtask, deleteSubtask, CustomTableCell }) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingValues, setEditingValues] = useState({});
  const [tasks, setTasks] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);
  const [showAddSubtask, setShowAddSubtask] = useState(null);
  const [editingSubtask, setEditingSubtask] = useState(null);

  const userEmail = Cookies.get('user_id');
  const { data: users } = useFrappeGetDocList('User', {
    fields: ['email'],
    limit: 1000,
  });

  const [newSubtask, setNewSubtask] = useState({
    subject: '',
    title: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
    assignedTo: [userEmail],
    description: '',
  });

  // API calls
  const { call: fetchTasks } = useFrappePostCall('novelite_us.novelite_us.api.Land_Acquisitions.tasksList.fetch.get_all_custom_tasks');
  const { call: addUpdateTask } = useFrappePostCall('novelite_us.novelite_us.api.Land_Acquisitions.tasksList.fetch.add_custom_task');
  const { call: deleteTask } = useFrappePostCall('novelite_us.novelite_us.api.Land_Acquisitions.tasksList.delete_task.delete_task');

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
      toast.error('Failed to fetch tasks');
    }
  };

  useEffect(() => {
    if (userEmail) loadTasks();
  }, [userEmail]);

  const handleAddSubtask = async (parentTaskId) => {
    if (!newSubtask.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await createSubtask({
        ...newSubtask,
        parent_task: parentTaskId,
        assigned_to_users: newSubtask.assignedTo,
        subject: newSubtask.title,
        exp_start_date: newSubtask.startDate,
        exp_end_date: newSubtask.endDate,
      });

      await loadTasks();
      setNewSubtask({
        title: '',
        status: '',
        priority: '',
        startDate: '',
        endDate: '',
        assignedTo: [userEmail],
        description: '',
      });
      setShowAddSubtask(null);
      toast.success('Subtask added successfully!');
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast.error('Failed to add subtask');
    }
  };

  const handleUpdateSubtask = async (subtaskId,parent_task) => {
    try {
      await updateSubtask(subtaskId, {
        subject: editingValues.title,
        status: editingValues.status,
        priority: editingValues.priority,
        exp_start_date: editingValues.startDate,
        exp_end_date: editingValues.endDate,
        assigned_to_users: editingValues.assignedTo,
        parent_task: parent_task
      });

      await loadTasks();
      setEditingSubtask(null);
      setEditingValues({});
      toast.success('Subtask updated successfully!');
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await deleteSubtask(subtaskId);
      await loadTasks();
      toast.success('Subtask deleted successfully!');
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast.error('Failed to delete subtask');
    }
  };

  const handleAddTask = async () => {
    if (!editingValues.title?.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await addUpdateTask({
        data: {
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
      setShowAddTask(false);
      setEditingValues({});
      toast.success('Task added successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to add task');
    }
  };

  const handleUpdateTask = async (project) => {
    if (!editingTask) return;

    try {
      await addUpdateTask({
        data: {
          name: editingTask,
          subject: editingValues.title,
          status: editingValues.status,
          priority: editingValues.priority,
          exp_start_date: editingValues.startDate,
          exp_end_date: editingValues.endDate,
          assigned_to_users: editingValues.assignedTo,
          project:project,
          custom_task: 1
        }
      });

      await loadTasks();
      setEditingTask(null);
      setEditingValues({});
      toast.success('Task updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask({ task_id: taskId });
      await loadTasks();
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
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
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell colSpan={7} sx={{ border: "none", p: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowAddTask(true)}
                    size='small'
                  >
                    Add New Task
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
            {showAddTask && (
              <TableRow>
                <TableCell colSpan={7} style={{ border: 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      label="Title"
                      value={editingValues.title || ''}
                      onChange={(e) => setEditingValues(prev => ({ ...prev, title: e.target.value }))}
                      size="small"
                    />
                    <TextField
                      type="date"
                      label="Start Date"
                      value={editingValues.startDate || ''}
                      onChange={(e) => setEditingValues(prev => ({ ...prev, startDate: e.target.value }))}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      value={editingValues.endDate || ''}
                      onChange={(e) => setEditingValues(prev => ({ ...prev, endDate: e.target.value }))}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <Select
                      value={editingValues.status || ''}
                      onChange={(e) => setEditingValues(prev => ({ ...prev, status: e.target.value }))}
                      size="small"
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Status</MenuItem>
                      {statusOptions.map(status => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                    <Select
                      value={editingValues.priority || ''}
                      onChange={(e) => setEditingValues(prev => ({ ...prev, priority: e.target.value }))}
                      size="small"
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Priority</MenuItem>
                      {priorityOptions.map(priority => (
                        <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                      ))}
                    </Select>
                    <Select
                      multiple
                      value={editingValues.assignedTo || []}
                      onChange={(e) => setEditingValues(prev => ({ ...prev, assignedTo: e.target.value }))}
                      renderValue={(selected) => <EmailAvatars emails={selected} />}
                      size="small"
                      sx={{ minWidth: 150 }}
                    >
                      {users?.map(user => (
                        <MenuItem key={user.email} value={user.email}>{user.email}</MenuItem>
                      ))}
                    </Select>
                    <Box>
                      <IconButton onClick={handleAddTask}>
                        <CheckIcon color="success" />
                      </IconButton>
                      <IconButton onClick={() => {
                        setShowAddTask(false);
                        setEditingValues({});
                      }}>
                        <CloseIcon color="error" />
                      </IconButton>
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              {['Task', 'Start Date', 'End Date', 'Status', 'Priority', 'Assigned To', 'Actions'].map((columnName) => (
                <CustomTableCell key={columnName}>{columnName}</CustomTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.filter(task => !task.parent_task).map(task => (
              <React.Fragment key={task.name}>
                <TableRow>
                  <TableCell style={{ border: "none", padding:"5px" }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => setExpandedTask(expandedTask === task.name ? null : task.name)}
                      >
                        {expandedTask === task.name ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      {editingTask === task.name ? (
                        <TextField
                          value={editingValues.title}
                          onChange={(e) => setEditingValues(prev => ({ ...prev, title: e.target.value }))}
                          size="small"
                          fullWidth
                        />
                      ) : (
                        <Typography>{task.subject}</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell style={{ border: "none", padding:"12px" }}>
                    {editingTask === task.name ? (
                      <TextField
                        type="date"
                        value={editingValues.startDate}
                        onChange={(e) => setEditingValues(prev => ({ ...prev, startDate: e.target.value }))}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : task.exp_start_date}
                  </TableCell>
                  <TableCell style={{ border: "none", padding:"12px" }}>
                    {editingTask === task.name ? (
                      <TextField
                        type="date"
                        value={editingValues.endDate}
                        onChange={(e) => setEditingValues(prev => ({ ...prev, endDate: e.target.value }))}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : task.exp_end_date}
                  </TableCell>
                  <TableCell style={{ border: "none", padding:"12px" }}>
                    {editingTask === task.name ? (
                      <Select
                        value={editingValues.status}
                        onChange={(e) => setEditingValues(prev => ({ ...prev, status: e.target.value }))}
                        size="small"
                      >
                        {statusOptions.map(status => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <Chip
                        label={task.status}
                        size="small"
                        sx={getStatusStyle(task.status)}
                      />
                    )}
                  </TableCell>
                  <TableCell style={{ border: "none", padding:"12px" }}>
                    {editingTask === task.name ? (
                      <Select
                        value={editingValues.priority}
                        onChange={(e) => setEditingValues(prev => ({ ...prev, priority: e.target.value }))}
                        size="small"
                      >
                        {priorityOptions.map(priority => (
                          <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <Chip
                        label={task.priority}
                        size="small"
                        sx={getPriorityStyle(task.priority)}
                      />
                    )}
                  </TableCell>
                  <TableCell style={{ border: "none", padding:"12px" }}>
                    <EmailAvatars emails={task.assigned_to_users || []} />
                  </TableCell>
                  <TableCell style={{ border: "none", padding:"12px" }}>
                    {editingTask === task.name ? (
                      <>
                        <IconButton onClick={()=> handleUpdateTask(task.project)}>
                          <CheckIcon color="success" />
                        </IconButton>
                        <IconButton onClick={() => {
                          setEditingTask(null);
                          setEditingValues({});
                        }}>
                          <CloseIcon color="error" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton onClick={() => {
                          setEditingTask(task.name);
                          setEditingValues({
                            title: task.subject,
                            startDate: task.exp_start_date,
                            endDate: task.exp_end_date,
                            status: task.status,
                            priority: task.priority,
                            assignedTo: task.assigned_to_users || []
                          });
                        }}>
                          <EditIcon color="primary" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteTask(task.name)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={7} style={{ paddingBottom: 0, paddingTop: 0, border: "none" }}>
                    <Collapse in={expandedTask === task.name} timeout="auto" unmountOnExit>
                      <Box>
                        {/* Subtasks Section */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between'}}>
                          <Typography variant="subtitle1">Subtasks</Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setShowAddSubtask(task.name)}
                            sx={{mb: "2px"}}
                          >
                            Add Subtask
                          </Button>
                        </Box>

                        {showAddSubtask === task.name && (
                          <Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <TextField
                                label="Title"
                                value={newSubtask.title}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                                size="small"
                              />
                              <TextField
                                type="date"
                                label="Start Date"
                                value={newSubtask.startDate}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, startDate: e.target.value }))}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                              <TextField
                                type="date"
                                label="End Date"
                                value={newSubtask.endDate}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, endDate: e.target.value }))}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                              <Select
                                value={newSubtask.status}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, status: e.target.value }))}
                                size="small"
                                displayEmpty
                              >
                                <MenuItem value="" disabled>Status</MenuItem>
                                {statusOptions.map(status => (
                                  <MenuItem key={status} value={status}>{status}</MenuItem>
                                ))}
                              </Select>
                              <Select
                                value={newSubtask.priority}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, priority: e.target.value }))}
                                size="small"
                                displayEmpty
                              >
                                <MenuItem value="" disabled>Priority</MenuItem>
                                {priorityOptions.map(priority => (
                                  <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                                ))}
                              </Select>
                              <Select
                                multiple
                                value={newSubtask.assignedTo}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, assignedTo: e.target.value }))}
                                renderValue={(selected) => <EmailAvatars emails={selected} />}
                                size="small"
                                sx={{ minWidth: 150 }}
                              >
                                {users?.map(user => (
                                  <MenuItem key={user.email} value={user.email}>{user.email}</MenuItem>
                                ))}
                              </Select>
                              <Box>
                                <IconButton onClick={() => handleAddSubtask(task.name)}>
                                  <CheckIcon color="success" />
                                </IconButton>
                                <IconButton onClick={() => {
                                  setShowAddSubtask(null);
                                  setNewSubtask({
                                    title: '',
                                    status: '',
                                    priority: '',
                                    startDate: '',
                                    endDate: '',
                                    assignedTo: [userEmail],
                                    description: '',
                                  });
                                }}>
                                  <CloseIcon color="error" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        )}

                        {/* Render Subtasks */}
                        <Box sx={{backgroundColor: '#282C34', borderRadius: 1}}>
                          <Table size="small">
                            <TableBody>
                              {tasks
                                .filter(subtask => subtask.parent_task === task.name)
                                .map(subtask => (
                                  <TableRow key={subtask.name}>
                                    <TableCell sx={{ border: "none", width: "180px" }}>
                                      {editingSubtask === subtask.name ? (
                                        <TextField
                                          value={editingValues.title}
                                          onChange={(e) => setEditingValues(prev => ({
                                            ...prev,
                                            title: e.target.value
                                          }))}
                                          size="small"
                                        />
                                      ) : subtask.subject}
                                    </TableCell>
                                    <TableCell style={{ border: "none" }}>
                                      {editingSubtask === subtask.name ? (
                                        <TextField
                                          type="date"
                                          value={editingValues.startDate || ''}
                                          onChange={(e) => setEditingValues(prev => ({
                                            ...prev,
                                            startDate: e.target.value
                                          }))}
                                          size="small"
                                        />
                                      ) : subtask.exp_start_date}
                                    </TableCell>
                                    <TableCell style={{ border: "none" }}>
                                      {editingSubtask === subtask.name ? (
                                        <TextField
                                          type="date"
                                          value={editingValues.endDate}
                                          onChange={(e) => setEditingValues(prev => ({
                                            ...prev,
                                            endDate: e.target.value
                                          }))}
                                          size="small"
                                        />
                                      ) : subtask.exp_end_date}
                                    </TableCell>
                                    <TableCell style={{ border: "none"}}>
                                      {editingSubtask === subtask.name ? (
                                        <Select
                                          value={editingValues.status}
                                          onChange={(e) => setEditingValues(prev => ({
                                            ...prev,
                                            status: e.target.value
                                          }))}
                                          size="small"
                                        >
                                          {statusOptions.map(status => (
                                            <MenuItem key={status} value={status}>{status}</MenuItem>
                                          ))}
                                        </Select>
                                      ) : (
                                        <Chip
                                          label={subtask.status}
                                          size="small"
                                          sx={getStatusStyle(subtask.status)}
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell style={{ border: "none" }}>
                                      {editingSubtask === subtask.name ? (
                                        <Select
                                          value={editingValues.priority}
                                          onChange={(e) => setEditingValues(prev => ({
                                            ...prev,
                                            priority: e.target.value
                                          }))}
                                          size="small"
                                        >
                                          {priorityOptions.map(priority => (
                                            <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                                          ))}
                                        </Select>
                                      ) : (
                                        <Chip
                                          label={subtask.priority}
                                          size="small"
                                          sx={getPriorityStyle(subtask.priority)}
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell style={{ border: "none" }}>
                                      <EmailAvatars emails={subtask.assigned_to_users || []} />
                                    </TableCell>
                                    <TableCell style={{ border: "none" }}>
                                      {editingSubtask === subtask.name ? (
                                        <>
                                          <IconButton onClick={() => handleUpdateSubtask(subtask.name,subtask.parent_task)} size="small">
                                            <CheckIcon color="success" />
                                          </IconButton>
                                          <IconButton onClick={() => setEditingSubtask(null)} size="small">
                                            <CloseIcon color="error" />
                                          </IconButton>
                                        </>
                                      ) : (
                                        <>
                                          <IconButton
                                            onClick={() => {
                                              setEditingSubtask(subtask.name);
                                              setEditingValues({
                                                title: subtask.subject,
                                                startDate: subtask.exp_start_date,
                                                endDate: subtask.exp_end_date,
                                                status: subtask.status,
                                                priority: subtask.priority,
                                                assignedTo: subtask.assigned_to_users || []
                                              });
                                            }}
                                            size="small"
                                          >
                                            <EditIcon color="primary" />
                                          </IconButton>
                                          <IconButton onClick={() => handleDeleteSubtask(subtask.name)} size="small">
                                            <DeleteIcon color="error" />
                                          </IconButton>
                                        </>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ToastContainer position="top-center" autoClose={1000} />
    </Box>
  );
}