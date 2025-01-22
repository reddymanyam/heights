import React, { useState } from 'react';
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

// Initial subtasks data
const initialSubtasks = [
    {
        id: 1,
        title: "Research local competitors",
        status: "Open",
        priority: "High",
        EndDate: "2024-01-20",
        assignedTo: ["john@example.com"],
        description: "Analyze competitor pricing and services in the local area"
    },
    {
        id: 2,
        title: "Create market analysis report",
        status: "Working",
        priority: "Medium",
        EndDate: "2024-01-25",
        assignedTo: ["sarah@example.com"],
        description: "Compile findings into a comprehensive report"
    },
    {
        id: 3,
        title: "Schedule team review meeting",
        status: "Completed",
        priority: "Low",
        EndDate: "2024-01-15",
        assignedTo: ["mike@example.com"],
        description: "Set up meeting to discuss findings with team"
    }
];

const SubtaskDrawer = ({
    open,
    onClose,
    selectedTask,
    users,
    statusOptions,
    priorityOptions,
    getStatusStyle,
    getPriorityStyle
}) => {
    const [subtasks, setSubtasks] = useState(selectedTask?.subtasks || initialSubtasks);
    const [showAddSubtask, setShowAddSubtask] = useState(false);
    const [editingSubtask, setEditingSubtask] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [description, setDescription] = useState(selectedTask?.description || '');

    const [newSubtask, setNewSubtask] = useState({
        title: '',
        status: '',
        priority: '',
        EndDate: '',
        assignedTo: [],
        description: ''
    });

    const [editValues, setEditValues] = useState({});

    // Filter assignee options based on search term
    const filteredAssigneeOptions = users
        ?.filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(user => user.email) || [];

    const handleAddSubtask = () => {
        if (!newSubtask.title.trim()) return;

        const subtask = {
            id: Date.now(),
            ...newSubtask
        };

        setSubtasks([...subtasks, subtask]);
        setNewSubtask({
            title: '',
            status: '',
            priority: '',
            EndDate: '',
            assignedTo: [],
            description: ''
        });
        setShowAddSubtask(false);
    };

    const handleEditSubtask = (subtask) => {
        setEditingSubtask(subtask.id);
        setEditValues({
            title: subtask.title,
            status: subtask.status,
            priority: subtask.priority,
            EndDate: subtask.EndDate,
            assignedTo: subtask.assignedTo,
            description: subtask.description
        });
    };

    const handleUpdateSubtask = (subtaskId) => {
        setSubtasks(subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, ...editValues } : subtask
        ));
        setEditingSubtask(null);
        setEditValues({});
    };

    const handleDeleteSubtask = (subtaskId) => {
        setSubtasks(subtasks.filter(subtask => subtask.id !== subtaskId));
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
                    width: '75%',
                    padding: 2,
                    boxSizing: 'border-box'
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box>
                    <Typography variant="h6" gutterBottom>
                        {selectedTask?.title}
                    </Typography>
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
                </Box>

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
                                label="Due Date"
                                value={newSubtask.EndDate}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, EndDate: e.target.value }))}
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={2}>
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
                        <Grid item xs={2}>
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
                        <Grid item xs={2}>
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
                    {subtasks.map(subtask => (
                        <ListItem
                            key={subtask.id}
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
                                            value={editValues.EndDate}
                                            onChange={(e) => handleEditChange('EndDate', e.target.value)}
                                            size="small"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
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
                                    <Grid item xs={2}>
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
                                    <Grid item xs={2}>
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
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={3}>
                                        <Typography variant="body2">{subtask.title}</Typography>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Typography variant="body2">{subtask.EndDate}</Typography>
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
                                    <Grid item xs={2}>
                                        <EmailAvatars emails={subtask.assignedTo} />
                                    </Grid>
                                    <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <IconButton onClick={() => handleEditSubtask(subtask)} size="small">
                                            <EditIcon sx={{ color: "green" }} />
                                        </IconButton>
                                        <IconButton onClick={() => handleDeleteSubtask(subtask.id)} size="small">
                                            <DeleteIcon  sx={{ color: "red" }} />
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