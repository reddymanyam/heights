import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Button, TextField, Select, MenuItem,
    List, ListItem,
    IconButton, Drawer, Chip, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EmailAvatars from './EmailAvatars';


const SubtaskDrawer = ({
    open,
    onClose,
    selectedTask,
    users = [],
    statusOptions,
    priorityOptions,
    getStatusStyle,
    getPriorityStyle,
    fetchSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask
}) => {
    const [subtasks, setSubtasks] = useState([]);
    const [showAddSubtask, setShowAddSubtask] = useState(false);
    const [editingSubtask, setEditingSubtask] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [description, setDescription] = useState(selectedTask?.description || '');

    // Fetch subtasks when drawer opens or selected task changes
    useEffect(() => {
        const loadSubtasks = async () => {
            if (selectedTask && selectedTask.id) {
                try {
                    const fetchedSubtasks = await fetchSubtasks(selectedTask.id);
                    // console.log("fetchedSubtasks", fetchedSubtasks);
                    
                    setSubtasks(fetchedSubtasks || []); 
                } catch (error) {
                    // console.error('Error fetching subtasks:', error);
                    setSubtasks([]); 
                }
            } else {
                setSubtasks([]); 
            }
        };
    
        if (open) {
            loadSubtasks();
        }
    }, [open, selectedTask, fetchSubtasks]);
    
    
     // Filter assignee options based on search term
     const filteredAssigneeOptions = users
     ?.filter(user => 
         user?.email && 
         user.email.toLowerCase().includes(searchTerm.toLowerCase())
     )
     .map(user => user.email) || [];

    const [newSubtask, setNewSubtask] = useState({
        subject: '',
        title: '',
        status: '',
        priority: '',
        StartDate: '',
        EndDate: '',
        assignedTo: [],
        description: '',
        parent_task: selectedTask?.id
    });

    const [editValues, setEditValues] = useState({});

    const handleAddSubtask = async () => {
        if (!newSubtask.title.trim()) return;

        try {
            const createdSubtask = await createSubtask({
                ...newSubtask,
                subject: newSubtask.title, 
                parent_task: selectedTask.id
            });

            setSubtasks([...subtasks, createdSubtask]);
            setNewSubtask({
                title: '',
                status: '',
                priority: '',
                StartDate: '',
                EndDate: '',
                assignedTo: [],
                description: '',
                parent_task: selectedTask.id
            });
            setShowAddSubtask(false);
        } catch (error) {
            // console.error('Error creating subtask:', error);
        }
    };

    const handleEditSubtask = (subtask) => {
        setEditingSubtask(subtask.id);
        setEditValues({
            title: subtask.title || '',
            status: subtask.status || '',
            priority: subtask.priority || '',
            StartDate: subtask.exp_start_date || '',
            EndDate: subtask.exp_end_date || '',
            assignedTo: subtask.assignedTo || [],
            description: subtask.description || ''
        });
    };

    const handleUpdateSubtask = async (subtaskId) => {
        try {
            const updatedSubtask = await updateSubtask(subtaskId, {
                ...editValues,
                parent_task: selectedTask.id
            });

            setSubtasks(subtasks.map(subtask =>
                subtask.id === subtaskId ? updatedSubtask : subtask
            ));
            setEditingSubtask(null);
            setEditValues({});
        } catch (error) {
            // console.error('Error updating subtask:', error);
        }
    };

    const handleDeleteSubtask = async (subtaskId) => {
        try {
            await deleteSubtask(subtaskId);
            setSubtasks(subtasks.filter(subtask => subtask.id !== subtaskId));
        } catch (error) {
            // console.error('Error deleting subtask:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditingSubtask(null);
        setEditValues({});
    };

    const handleEditChange = (field, value) => {
        setEditValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{
                '& .MuiDrawer-paper': {
                    width: '80%',
                    padding: 2,
                    boxSizing: 'border-box'
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            {selectedTask?.title}
                        </Typography>
                        <IconButton onClick={onClose} style={{ borderRadius: '50%', backgroundColor: 'red', padding: '3px', marginBottom: "5px" }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">Subtasks</Typography>
                        <Button
                            variant="contained"
                            onClick={() => setShowAddSubtask(true)}
                            startIcon={<AddIcon />}
                            size="small"
                        >
                            Add Subtask
                        </Button>
                    </Box>
                </>

                {/* Add Subtask Form */}
                {showAddSubtask && (
                    <Grid container spacing={2} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Grid item xs={3}>
                            <TextField
                                fullWidth
                                label="Title"
                                value={newSubtask.title}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={2}>
                            <TextField
                                type="date"
                                value={newSubtask.StartDate}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, StartDate: e.target.value }))}
                                size="small"
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={2}>
                            <TextField
                                type="date"
                                value={newSubtask.EndDate}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, EndDate: e.target.value }))}
                                size="small"
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={1}>
                            <Select
                                value={newSubtask.status}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, status: e.target.value }))}
                                size="small"
                                fullWidth
                                renderValue={(value) => value || "Status"}
                            >
                                {statusOptions.map(status => (
                                    <MenuItem key={status} value={status}>{status}</MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={1}>
                            <Select
                                value={newSubtask.priority}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, priority: e.target.value }))}
                                size="small"
                                fullWidth
                                renderValue={(value) => value || "Priority"}
                            >
                                {priorityOptions.map(priority => (
                                    <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={1}>
                            <Select
                                multiple
                                fullWidth
                                value={newSubtask.assignedTo}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, assignedTo: e.target.value }))}
                                renderValue={(selected) => <EmailAvatars emails={selected} />}
                                size="small"
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
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton onClick={handleAddSubtask} size="small">
                                <CheckIcon sx={{ color: "green" }} />
                            </IconButton>
                            <IconButton onClick={() => setShowAddSubtask(false)} size="small">
                                <CloseIcon sx={{ color: "red" }} />
                            </IconButton>
                        </Grid>
                    </Grid>
                )}

                {/* Subtasks List */}
                <List sx={{ flex: 1, overflow: 'auto' }}>
                    {(subtasks || []).map(subtask => (
                        <ListItem
                            key={subtask.name}
                            sx={{
                                mb: 1,
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            {editingSubtask === subtask.id ? (
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={3}>
                                        <TextField
                                            fullWidth
                                            value={editValues.title}
                                            onChange={(e) => handleEditChange('title', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            type="date"
                                            value={editValues.StartDate}
                                            onChange={(e) => handleEditChange('StartDate', e.target.value)}
                                            size="small"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField
                                            type="date"
                                            value={editValues.EndDate}
                                            onChange={(e) => handleEditChange('EndDate', e.target.value)}
                                            size="small"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={1}>
                                        <Select
                                            value={editValues.status}
                                            onChange={(e) => handleEditChange('status', e.target.value)}
                                            size="small"
                                            fullWidth
                                        >
                                            {statusOptions.map(status => (
                                                <MenuItem key={status} value={status}>{status}</MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                    <Grid item xs={1}>
                                        <Select
                                            value={editValues.priority}
                                            onChange={(e) => handleEditChange('priority', e.target.value)}
                                            size="small"
                                            fullWidth
                                        >
                                            {priorityOptions.map(priority => (
                                                <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                    <Grid item xs={1}>
                                        <Select
                                            multiple
                                            fullWidth
                                            value={editValues.assignedTo}
                                            onChange={(e) => handleEditChange('assignedTo', e.target.value)}
                                            renderValue={(selected) => <EmailAvatars emails={selected} />}
                                            size="small"
                                        >
                                            {filteredAssigneeOptions.map(option => (
                                                <MenuItem key={option} value={option}>{option}</MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                    <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <IconButton onClick={() => handleUpdateSubtask(subtask.id)} size="small">
                                            <CheckIcon sx={{ color: "green" }} />
                                        </IconButton>
                                        <IconButton onClick={handleCancelEdit} size="small">
                                            <CloseIcon sx={{ color: "red" }} />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Grid container spacing={1} alignItems="center">
                                    <Grid item xs={3}>
                                        <Typography variant="body2">{subtask.subject || "N/A"}</Typography>
                                    </Grid>
                                    <Grid item xs={1}>
                                        <Typography variant="body2">{subtask.exp_start_date || "N/A"}</Typography>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Typography variant="body2">{subtask.exp_end_date || "N/A"}</Typography>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Chip
                                            label={subtask.status}
                                            size="small"
                                            sx={{ ...getStatusStyle(subtask.status) }}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Chip
                                            label={subtask.priority}
                                            size="small"
                                            sx={{ ...getPriorityStyle(subtask.priority) }}
                                        />
                                    </Grid>
                                    <Grid item xs={1}>
                                        <EmailAvatars emails={subtask.assignedTo || []} />
                                    </Grid>
                                    <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <IconButton onClick={() => handleEditSubtask(subtask)} size="small">
                                            <EditIcon sx={{ color: "green" }} />
                                        </IconButton>
                                        <IconButton onClick={() => handleDeleteSubtask(subtask.id)} size="small">
                                            <DeleteIcon sx={{ color: "red" }} />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            )}
                        </ListItem>
                    ))}
                </List>

                {/* Description Section */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Description
                    </Typography>
                    <TextField
                        multiline
                        rows={4}
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add task description here..."
                    />
                </Box>
            </Box>
        </Drawer>
    );
};

export default SubtaskDrawer;