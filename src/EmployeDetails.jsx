import React, { useEffect, useState } from "react";
import { Table, TableBody, TableRow, TableCell, Button, TextField, Drawer } from "@mui/material";


const EmployeDetails = () => {

  const [open, setOpen] = React.useState(false);
  const [open1, setOpen1] = React.useState(false);
  const [employeDetails, setemployeDetails] = useState([]);
  const [editemployeDetails, setEditemployeDetails] = useState({
    "name": "",
    "designation": "",
    "salary": "",
    "number": "",
    "email": "",
    "payscale": ""
  });
 
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const toggleDrawer1 = (newOpen1) => () => {
    setOpen1(newOpen1);
  };

  const getData = () => {
    fetch(" http://localhost:5000/employees").then((res) => res.json())
      .then((data) => setemployeDetails(data))
      .catch((err) => console.log(err));
  }

  useEffect(() => {
    getData();
  }, []);

  const handleAddTask = () => {
    fetch(" http://localhost:5000/employees",{
      method :"POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:editemployeDetails.name,
        designation:editemployeDetails.designation,
        salary:editemployeDetails.salary,
        number:editemployeDetails.number,
        email:editemployeDetails.email
      })    
    })}

  const handleUpdateTask = () => {
    put(" http://localhost:5000/employees", {
      name: editemployeDetails.name,
      designation: editemployeDetails.designation,
      salary: editemployeDetails.salary,
      number: editemployeDetails.number,
      email: editemployeDetails.email,
    })
  }

  const handleDeleteTask = () => {

  }

  return (
    <>

      <Table>
        <Button onClick={toggleDrawer(true)}>AddTask</Button>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Designation</TableCell>
          <TableCell>Salary</TableCell>
          <TableCell>Number</TableCell>
          <TableCell>Email</TableCell>
        </TableRow>
        <TableBody>
          {employeDetails.map((data) =>(
              <TableRow>
                <TableCell>{data.name}</TableCell>
                <TableCell>{data.designation}</TableCell>
                <TableCell>{data.salary}</TableCell>
                <TableCell>{data.number}</TableCell>
                <TableCell>{data.email}</TableCell>
                <Button onClick={toggleDrawer1(true)}>Edit</Button>
                <Button onclick={handleDeleteTask}>Delete</Button>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
      <Drawer open={open} >
        <Button onClick={toggleDrawer(false)}>Close</Button>
        <Table>
          <TableCell>
            <TextField value={editemployeDetails.name} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, name: e.target.value })}></TextField>
          </TableCell>
          <TableCell>
            <TextField value={editemployeDetails.designation} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, designation: e.target.value })}></TextField>
          </TableCell>
          <TableCell>
            <TextField value={editemployeDetails.salary} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, salary: e.target.value })}></TextField>
          </TableCell>
          <TableCell>
            <TextField value={editemployeDetails.number} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, number: e.target.value })}></TextField>
          </TableCell>
          <TableCell>
            <TextField value={editemployeDetails.email} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, email: e.target.value })}></TextField>
          </TableCell>
          <TableCell>
            <TextField value={editemployeDetails.payscale} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, payscale: e.target.value })}></TextField>
          </TableCell>
          <Button onClick={handleAddTask}>AddTask</Button>
        </Table>
      </Drawer>
      <Drawer open={open1}>
      <Button onClick={toggleDrawer1(false)}>Close</Button>
        <Table>
          <TableCell>
            <TextField value={employeDetails.name} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, name: e.target.value })}></TextField>
          </TableCell>
          <TableCell>
            <TextField value={editemployeDetails.designation} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, designation: e.target.value })}></TextField>
          </TableCell>
          <TableCell>
            <TextField value={editemployeDetails.salary} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, salary: e.target.value })}></TextField>
          </TableCell>
          <TableCell>
            <TextField value={editemployeDetails.number} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, number: e.target.value })}></TextField>
          </TableCell>
          <TableCell>
            <TextField value={editemployeDetails.email} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, email: e.target.value })}></TextField>
          </TableCell>
          <TableCell>
            <TextField value={editemployeDetails.payscale} onChange={(e) => setEditemployeDetails({ ...editemployeDetails, payscale: e.target.value })}></TextField>
          </TableCell>
          <Button onclick={handleUpdateTask}>Update Task</Button>
        </Table>
      </Drawer>
    </>
  )
}

export default EmployeDetails;