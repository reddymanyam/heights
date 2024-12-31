import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Box, Typography, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

const API_URL = "http://localhost:4000/projects";

export default function ProjectManager() {
    const [statusOptions, setStatusOptions] = useState([]);
    const [priorityOptions, setPriorityOptions] = useState([]);
    const [assigneeOptions, setAssigneeOptions] = useState([]);
    const [editingSubtask, setEditingSubtask] = useState(null);

    const [editingValues, setEditingValues] = useState({
        title: "",
        startDate: "",
        endDate: "",
        status: "",
        priority: "",
        assignedTo: []
    });

    const [projects, setProjects] = useState([]);
    const [expandedProjectId, setExpandedProjectId] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isAddSubtaskDialogOpen, setIsAddSubtaskDialogOpen] = useState(false);

    const [newProject, setNewProject] = useState({ 
        project: "", 
        subtasks: [] });

    const [newSubtask, setNewSubtask] = useState({
        title: "",
        startDate: "",
        endDate: "",
        status: "",
        priority: "",
        assignedTo: []
    });
    
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [projectsData, statusData, priorityData, assigneeData] = await Promise.all([
                    fetch(API_URL).then(res => res.json()),
                    fetch("http://localhost:4000/statusOptions").then(res => res.json()),
                    fetch("http://localhost:4000/priorityOptions").then(res => res.json()),
                    fetch("http://localhost:4000/assigneeOptions").then(res => res.json())
                ]);

                setProjects(projectsData);
                setStatusOptions(statusData);
                setPriorityOptions(priorityData);
                setAssigneeOptions(assigneeData);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    const handleAddProject = async () => {
        try {
            const newProjectData = { ...newProject, id: Date.now() };
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProjectData)
            });
            const data = await response.json();
            setProjects(prev => [...prev, data]);
            setNewProject({ project: "", subtasks: [] });
            setIsAddDialogOpen(false);
        } catch (error) {
            console.error("Error adding project:", error);
        }
    };

    const handleAddSubtask = async () => {
        if (!selectedProjectId) return;

        try {
            const selectedProject = projects.find(p => p.id === selectedProjectId);
            const updatedProject = {
                ...selectedProject,
                subtasks: [...selectedProject.subtasks, { ...newSubtask, id: Date.now() }]
            };

            const response = await fetch(`${API_URL}/${selectedProjectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedProject)
            });
            const updated = await response.json();
            
            setProjects(prev =>
                prev.map(project => (project.id === selectedProjectId ? updated : project))
            );

            setNewSubtask({
                title: "",
                startDate: "",
                endDate: "",
                status: "",
                priority: "",
                assignedTo: []
            });
            setIsAddSubtaskDialogOpen(false);
        } catch (error) {
            console.error("Error adding subtask:", error);
        }
    };

    const handleDeleteSubtask = async (projectId, subtaskId) => {
        try {
            const selectedProject = projects.find(p => p.id === projectId);
            const updatedProject = {
                ...selectedProject,
                subtasks: selectedProject.subtasks.filter(subtask => subtask.id !== subtaskId)
            };

            const response = await fetch(`${API_URL}/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedProject)
            });
            const updated = await response.json();
            
            setProjects(prev =>
                prev.map(project => (project.id === projectId ? updated : project))
            );
        } catch (error) {
            console.error("Error deleting subtask:", error);
        }
    };

    const handleEditSubtask = (projectId, subtask) => {
        setEditingSubtask({ projectId, subtaskId: subtask.id });
        setEditingValues({
            title: subtask.title,
            startDate: subtask.startDate,
            endDate: subtask.endDate,
            status: subtask.status,
            priority: subtask.priority,
            assignedTo: subtask.assignedTo
        });
    };

    const handleEditChange = (field, value) => {
        setEditingValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveEdit = async (projectId, subtaskId) => {
        try {
            const selectedProject = projects.find(p => p.id === projectId);
            const updatedProject = {
                ...selectedProject,
                subtasks: selectedProject.subtasks.map(subtask =>
                    subtask.id === subtaskId ? { ...subtask, ...editingValues } : subtask
                )
            };

            const response = await fetch(`${API_URL}/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedProject)
            });
            const updated = await response.json();
            
            setProjects(prev =>
                prev.map(project => (project.id === projectId ? updated : project))
            );
            
            handleCancelEdit();
        } catch (error) {
            console.error("Error saving edit:", error);
        }
    };

    const handleCancelEdit = () => {
        setEditingSubtask(null);
        setEditingValues({
            title: "",
            startDate: "",
            endDate: "",
            status: "",
            priority: "",
            assignedTo: []
        });
    };

    const isEditing = (projectId, subtaskId) =>
        editingSubtask?.projectId === projectId && editingSubtask?.subtaskId === subtaskId;

    return (
        <Box m={2}>
            <TableContainer component={Paper} sx={{ marginTop: 3 }}>
                <Box sx={{ display: "flex", gap: 2, p: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        Add Project
                    </Button>
                </Box>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <strong>Project</strong>
                            </TableCell>
                            <TableCell>
                                <strong>Actions</strong>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {projects.map((project) => (
                            <React.Fragment key={project.id}>
                                <TableRow>
                                    <TableCell>
                                        <Typography
                                            onClick={() => setExpandedProjectId(
                                                expandedProjectId === project.id ? null : project.id
                                            )}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {project.project} {expandedProjectId === project.id ? "▲" : "▼"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => {
                                                setSelectedProjectId(project.id);
                                                setIsAddSubtaskDialogOpen(true);
                                            }}
                                        >
                                            Add Subtask
                                        </Button>
                                    </TableCell>
                                </TableRow>

                                {expandedProjectId === project.id && (
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Subtask</TableCell>
                                                        <TableCell>Start Date</TableCell>
                                                        <TableCell>End Date</TableCell>
                                                        <TableCell>Status</TableCell>
                                                        <TableCell>Priority</TableCell>
                                                        <TableCell>Assigned To</TableCell>
                                                        <TableCell>Actions</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {project.subtasks.map((subtask) => (
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
                                                                            <CheckIcon color="success" />
                                                                        </IconButton>
                                                                        <IconButton onClick={handleCancelEdit}>
                                                                            <CloseIcon color="error" />
                                                                        </IconButton>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <IconButton onClick={() => handleEditSubtask(project.id, subtask)}>
                                                                            <EditIcon color="primary" />
                                                                        </IconButton>
                                                                        <IconButton onClick={() => handleDeleteSubtask(project.id, subtask.id)}>
                                                                            <DeleteIcon color="error" />
                                                                        </IconButton>
                                                                    </>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
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

           {/* Add Project Dialog */}
           <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
                <DialogTitle>Add New Project</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Project Name"
                        fullWidth
                        value={newProject.project}
                        onChange={(e) => setNewProject(prev => ({ ...prev, project: e.target.value }))}
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddProject}>
                        Add Project
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Subtask Dialog */}
            <Dialog 
                open={isAddSubtaskDialogOpen} 
                onClose={() => setIsAddSubtaskDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Add New Subtask</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Subtask Title"
                            fullWidth
                            value={newSubtask.title}
                            onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                        />
                        
                        <TextField
                            label="Start Date"
                            type="date"
                            fullWidth
                            value={newSubtask.startDate}
                            onChange={(e) => setNewSubtask(prev => ({ ...prev, startDate: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                        />
                        
                        <TextField
                            label="End Date"
                            type="date"
                            fullWidth
                            value={newSubtask.endDate}
                            onChange={(e) => setNewSubtask(prev => ({ ...prev, endDate: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                        />
                        
                        <Select
                            value={newSubtask.status}
                            onChange={(e) => setNewSubtask(prev => ({ ...prev, status: e.target.value }))}
                            fullWidth
                            displayEmpty
                            renderValue={value => value || "Select Status"}
                        >
                            {statusOptions.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status}
                                </MenuItem>
                            ))}
                        </Select>

                        <Select
                            value={newSubtask.priority}
                            onChange={(e) => setNewSubtask(prev => ({ ...prev, priority: e.target.value }))}
                            fullWidth
                            displayEmpty
                            renderValue={value => value || "Select Priority"}
                        >
                            {priorityOptions.map((priority) => (
                                <MenuItem key={priority} value={priority}>
                                    {priority}
                                </MenuItem>
                            ))}
                        </Select>

                        <Select
                            multiple
                            value={newSubtask.assignedTo}
                            onChange={(e) => setNewSubtask(prev => ({ ...prev, assignedTo: e.target.value }))}
                            fullWidth
                            displayEmpty
                            renderValue={selected => {
                                if (selected.length === 0) {
                                    return "Select Assignees";
                                }
                                return selected.join(", ");
                            }}
                        >
                            {assigneeOptions.map((assignee) => (
                                <MenuItem key={assignee} value={assignee}>
                                    {assignee}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsAddSubtaskDialogOpen(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleAddSubtask}
                        disabled={!newSubtask.title || !newSubtask.startDate || !newSubtask.endDate || !newSubtask.status || !newSubtask.priority}
                    >
                        Add Subtask
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}