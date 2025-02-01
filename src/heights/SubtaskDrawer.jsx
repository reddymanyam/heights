import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    Box, Typography, Button, TextField, Select, MenuItem,
    List, ListItem,
    IconButton, Drawer, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
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
    deleteSubtask,
    updateTask,
}) => {
    const [subtasks, setSubtasks] = useState([]);
    const [showAddSubtask, setShowAddSubtask] = useState(false);
    const [editingSubtask, setEditingSubtask] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [description, setDescription] = useState('');

    // Fetch subtasks when drawer opens or selected task changes
    useEffect(() => {
        const loadSubtasks = async () => {
            // console.log("selectedTask--->", selectedTask);

            if (selectedTask && selectedTask.id) {
                try {
                    const fetchedSubtasks = await fetchSubtasks(selectedTask.id);

                    // Map the fetched subtasks to match the expected structure
                    const mappedSubtasks = fetchedSubtasks.map(subtask => ({
                        id: subtask.name,
                        title: subtask.subject,
                        status: subtask.status,
                        priority: subtask.priority,
                        exp_start_date: subtask.exp_start_date,
                        exp_end_date: subtask.exp_end_date,
                        assignedTo: subtask.assigned_to_users || [],
                        description: subtask.description
                    }));

                    setSubtasks(mappedSubtasks || []);
                } catch (error) {
                    console.error('Error fetching subtasks:', error);
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
        startDate: '',
        endDate: '',
        assignedTo: [],
        description: '',
        parent_task: selectedTask?.id
    });

    const [editValues, setEditValues] = useState({});

    const handleAddSubtask = async () => {
        if (!newSubtask.title.trim()) return;

        // Validate start date against parent task's start date
        if (newSubtask.startDate) {
            const subtaskstartDate = new Date(newSubtask.startDate);
            const parentTaskstartDate = new Date(selectedTask.endDate);
            // console.log("subtaskstartDate--->",subtaskstartDate,"parentTaskstartDate--->", parentTaskstartDate);
            // console.log(subtaskstartDate > parentTaskstartDate);

            if (subtaskstartDate > parentTaskstartDate) {
                alert(`Subtask start date must be on or before the parent task's start date (${selectedTask.endDate})`);
                return;
            }
        }

        // Validate end date against parent task's end date
        if (newSubtask.endDate) {
            const subtaskendDate = new Date(newSubtask.endDate);
            const parentTaskendDate = new Date(selectedTask.endDate);
            // console.log("subtaskendDate--->",subtaskendDate,"parentTaskendDate--->", parentTaskendDate);
            if (subtaskendDate > parentTaskendDate) {
                alert(`Subtask end date must be on or before the parent task's end date (${selectedTask.endDate})`);
                return;
            }
        }

        // Proceed with the rest of the code if validation passes
        try {
            const subtaskData = {
                subject: newSubtask.title,
                status: newSubtask.status,
                priority: newSubtask.priority,
                exp_start_date: newSubtask.startDate,
                exp_end_date: newSubtask.endDate,
                assigned_to_users: newSubtask.assignedTo,
                description: newSubtask.description,
                parent_task: selectedTask.id,
                custom_task: 1,
            };

            // Create the subtask
            await createSubtask(subtaskData);

            // Reset form
            setNewSubtask({
                title: '',
                status: '',
                priority: '',
                startDate: '',
                endDate: '',
                assignedTo: [],
                description: '',
                parent_task: selectedTask.id
            });
            setShowAddSubtask(false);
            toast.success('Subtask added successfully!');
        } catch (error) {
            console.error('Error creating subtask:', error);
            alert('Failed to add Subtask!');
        }
    };


    const handleEditSubtask = (subtask) => {
        setEditingSubtask(subtask.id);
        setEditValues({
            title: subtask.title || '',
            status: subtask.status || '',
            priority: subtask.priority || '',
            startDate: subtask.exp_start_date || '',
            endDate: subtask.exp_end_date || '',
            assignedTo: subtask.assignedTo || [],
            description: subtask.description || '',
            parent_task: selectedTask.id
        });
    };

    const handleUpdateSubtask = async (subtaskId) => {
        try {

            setSubtasks(prevSubtasks =>
                prevSubtasks.map(subtask =>
                    subtask.id === subtaskId
                        ? { ...subtask, ...editValues }
                        : subtask
                )
            );

            // Prepare updated subtask data
            const updatedSubtaskData = {
                name: subtaskId,
                subject: editValues.title,
                status: editValues.status,
                priority: editValues.priority,
                exp_start_date: editValues.startDate,
                exp_end_date: editValues.endDate,
                assigned_to_users: editValues.assignedTo,
                description: editValues.description,
                parent_task: selectedTask.id,
                custom_task: 1,
            };

            // Call updateSubtask method passed from parent component
            await updateSubtask(subtaskId, updatedSubtaskData);

            // Reset editing state
            setEditingSubtask(null);
            setEditValues({});
            toast.success('Subtask updated successfully!');
        } catch (error) {
            console.error('Error updating subtask:', error);
            alert(error.exception);
        }
    };


    const handleDeleteSubtask = async (subtaskId) => {
        try {
            // Call deleteSubtask method passed from parent component
            await deleteSubtask(subtaskId);
            toast.success('Subtask deleted successfully!');
        } catch (error) {
            console.error('Error deleting subtask:', error);
            alert('Failed to delete Subtask!');
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

    useEffect(() => {
        if (selectedTask && open) {
            setDescription(selectedTask.description || '');
        }
    }, [selectedTask, open]);

    // function to handle description update
    const handleDescriptionUpdate = async () => {
        try {
            await updateTask({
                data: {
                    name: selectedTask.id,
                    description: description,  // Use the description from state
                    subject: selectedTask.title,
                    status: selectedTask.status,
                    priority: selectedTask.priority,
                    exp_start_date: selectedTask.startDate,
                    exp_end_date: selectedTask.endDate,
                    assigned_to_users: selectedTask.assignedTo,
                    parent_task: selectedTask.parent_task,
                    project: selectedTask.project, 
                    project_name: selectedTask.project_name,
                    custom_task: 1
                }
            });
            alert('Description updated successfully!:');
        } catch (error) {
            console.error('Error updating description:', error);
            alert('Failed to update description');
        }
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
                    <Grid container sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Grid size={{ xs: "20px" }} sx={{ mr: 1 }}>
                            <TextField
                                fullWidth
                                label="Title"
                                value={newSubtask.title}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: "10px" }} sx={{ mr: 1 }}>
                            <TextField
                                type="date"
                                value={newSubtask.startDate}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, startDate: e.target.value }))}
                                size="small"
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: "10px" }} sx={{ mr: 1 }}>
                            <TextField
                                type="date"
                                value={newSubtask.endDate}
                                onChange={(e) => setNewSubtask(prev => ({ ...prev, endDate: e.target.value }))}
                                size="small"
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 1 }} sx={{ mr: 1 }}>
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
                        <Grid size={{ xs: 1 }} sx={{ mr: 1 }}>
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
                        <Grid size={{ xs: 2 }}>
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
                        <Grid size={{ xs: 1 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                    {(subtasks).map(subtask => (
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
                                    <Grid size={{ xs: 2 }}>
                                        <TextField
                                            fullWidth
                                            value={editValues.title}
                                            onChange={(e) => handleEditChange('title', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 2 }}>
                                        <TextField
                                            type="date"
                                            value={editValues.startDate}
                                            onChange={(e) => handleEditChange('startDate', e.target.value)}
                                            size="small"
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 2 }}>
                                        <TextField
                                            type="date"
                                            value={editValues.endDate}
                                            onChange={(e) => handleEditChange('endDate', e.target.value)}
                                            size="small"
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 1 }} sx={{ width: "100px" }}>
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
                                    <Grid size={{ xs: 1 }} sx={{ width: "100px" }}>
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
                                    <Grid size={{ xs: 2 }}>
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
                                    <Grid size={{ xs: 1 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <IconButton onClick={() => handleUpdateSubtask(subtask.id)} size="small">
                                            <CheckIcon sx={{ color: "green" }} />
                                        </IconButton>
                                        <IconButton onClick={handleCancelEdit} size="small">
                                            <CloseIcon sx={{ color: "red" }} />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Box sx={{ flexGrow: 1 }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid size={{ xs: 2 }}>
                                            <Typography variant="body2">{subtask.title || "N/A"}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 2 }}>
                                            <Typography variant="body2">{subtask.exp_start_date || "N/A"}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 2 }}>
                                            <Typography variant="body2">{subtask.exp_end_date || "N/A"}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 2 }}>
                                            <Chip
                                                label={subtask.status}
                                                size="small"
                                                sx={{ ...getStatusStyle(subtask.status) }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 2 }}>
                                            <Chip
                                                label={subtask.priority}
                                                size="small"
                                                sx={{ ...getPriorityStyle(subtask.priority) }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 1 }}>
                                            <EmailAvatars emails={subtask.assignedTo || []} />
                                        </Grid>
                                        <Grid size={{ xs: 1 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <IconButton onClick={() => handleEditSubtask(subtask)} size="small">
                                                <EditIcon sx={{ color: "green" }} />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteSubtask(subtask.id)} size="small">
                                                <DeleteIcon sx={{ color: "red" }} />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Box>
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
                    <Button
                        variant="contained"
                        onClick={() => handleDescriptionUpdate()}
                        sx={{ mt: 1 }}
                    >
                        Save Description
                    </Button>
                </Box>
            </Box>
            <ToastContainer position="top-center" autoClose={1000} />
        </Drawer>
    );
};

export default SubtaskDrawer;