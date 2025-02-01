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
    fetch("http://localhost:5000/employees").then((res) => res.json())
      .then((data) => setemployeDetails(data))
      .catch((err) => console.log(err));
  }

  useEffect(() => {
    getData();
  }, []);

  const handleAddTask = () => {
    fetch(" http://localhost:5000/employees",{
      method :"POST",
      headers: { "Content-Type": "application/json" },   //-------------------IMPORTANT-----------------------
      body: JSON.stringify({                             //or simply we can do body: JSON.stringify(editemployeDetails)
        name:editemployeDetails.name,                    //if we want some extra information with it then  
        designation:editemployeDetails.designation,      // body: JSON.stringify({ ...editemployeDetails, 
        salary:editemployeDetails.salary,                //                         employee_status: editemployeDetails.employeeStatus })                      })
        number:editemployeDetails.number,
        email:editemployeDetails.email
      })    
    })
    .then((response) => {
      if(!response.ok){
        throw new Error("Failed to add Task")
      }
      return response.json();
    })
    .then(()=>getData())
    .catch(err => console.log(err.message))   //console.log(err.response) will work in axios for fetch we want to use (err.message)
    setEditemployeDetails({
      name:"",
      designation:"",
      salary:"",
      number:"",
      email:""
    });
    setOpen(false);
  }

  const handleUpdateTask = () => {
   fetch(`http://localhost:5000/employees/${editemployeDetails.id}`,{
    method:"PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id:editemployeDetails.id,
      name:editemployeDetails.name,
      designation:editemployeDetails.designation,
      salary:editemployeDetails.salary,
      number:editemployeDetails.number,
      email:editemployeDetails.email
    })


   }).then((response) =>{
    if(!response.ok){
      throw new Error("Failed to update the task")
    }
    return response.json()
   }).then(()=>getData())
     .catch((err)=>console.log(err.message)
     )
   
   setOpen1(false);
  }
  

  const handleDeleteTask = (id) => {
      fetch(`http://localhost:5000/employees/${id}`,{
        method:"DELETE",
        headers: { "Content-Type": "application/json" }
      }).then(()=>setemployeDetails(prevValue =>(prevValue.filter((employee)=>(        //filter always returns the boolean value, not the complete array
        employee.id !== id
      )))))
        .catch((err) => console.log(err.message))
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
          <TableCell sx={{marginLeft:"50px"}}>Actions</TableCell>
        </TableRow>
        <TableBody>
          {employeDetails.map((data) =>(
              <TableRow>
                <TableCell>{data.name}</TableCell>
                <TableCell>{data.designation}</TableCell>
                <TableCell>{data.salary}</TableCell>
                <TableCell>{data.number}</TableCell>
                <TableCell>{data.email}</TableCell>
                <Button onClick={()=>{
                  setEditemployeDetails({...data});
                  setOpen1(true);
                }}>Edit</Button>
                <Button onClick={() => handleDeleteTask(data.id)}>Delete</Button>
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
          <Button onClick={handleAddTask}>AddTask</Button>
        </Table>
      </Drawer>
      <Drawer open={open1}>
      <Button onClick={toggleDrawer1(false)}>Close</Button>
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
          <Button onClick={handleUpdateTask}>Update Task</Button>
        </Table>
      </Drawer>
    </>
  )
}

export default EmployeDetails;