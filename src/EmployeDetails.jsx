import { TableCell, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react'

const EmployeDetails = () => {

  const [employeDetails, setemployeDetails] = useState({
                                                  "name": "",   
                                                  "designation": "",
                                                  "salary": "",
                                                  "number": "",
                                                  "email": "",
                                                  "payscale": ""
                                                  });

  const [editemployeDetails, setEditemployeDetails] = useState({
                                                   "name": "",   
                                                  "designation": "",
                                                  "salary": "",
                                                  "number": "",
                                                  "email": "",
                                                  "payscale": ""
  })

  const getData = () => {
    fetch("https://www.employeedetails.com").then((res)=>response)
                                            .then((data)=> response.json())
                                            setemployeDetails(data)
                                            .catch((err) => console.log(err));
  }

  useEffect(()=>{
    getData();
  },[]);

  const handleAddTask = () =>{
      post("https://www.employeedetails.com",{
        name:employeDetails.name,
        designation:employeDetails.designation,
        salary:employeDetails.salary,
        number:employeDetails.number,
        email:employeDetails.email,
        payscale:employeDetails.payscale
      })
  }

  const handleUpdateTask = () =>{
    put("https://www.employeedetails.com",{
      name:editemployeDetails.name,
      designation:editemployeDetails.designation,
      salary:editemployeDetails.salary,
      number:editemployeDetails.number,
      email:editemployeDetails.email,
      payscale:editemployeDetails.payscale
    })
  }
  return (
    <>
      <Table>
        <Button>handleAddTask</Button>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Designation</TableCell>
          <TableCell>Salary</TableCell>
          <TableCell>Number</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>PayScale</TableCell>
          <Button onclick={habdleEditTask}>handleEditTask</Button>
          <Button onclick={handleUpdateTask}>handleUpdateTask</Button>
        </TableRow>
        <TableBody>
          {employeDetails.map((data) => {
            <>
            <TableCell>{data.name}</TableCell>
            <TableCell>{data.designation}</TableCell>
            <TableCell>{data.salary}</TableCell>
            <TableCell>{data.number}</TableCell>
            <TableCell>{data.email}</TableCell>
            <TableCell>{data.payscale}</TableCell>
            </>
          })}
        </TableBody>
      </Table>
      <Drawer>
           <Table>
            <TableCell>
              <TextField value={employeDetails.name} onChange={(e) => setemployeDetails({...employeDetails, name:e.target.value})}></TextField>
            </TableCell>
            <TableCell>
              <TextField value={employeDetails.designation} onChange={(e) => setemployeDetails({...employeDetails, designation:e.target.value})}></TextField>
            </TableCell>
            <TableCell>
              <TextField value={employeDetails.salary} onChange={(e) => setemployeDetails({...employeDetails, salary:e.target.value})}></TextField>
            </TableCell>
            <TableCell>
              <TextField value={employeDetails.number} onChange={(e) => setemployeDetails({...employeDetails, number:e.target.value})}></TextField>
            </TableCell>
            <TableCell>
              <TextField value={employeDetails.email} onChange={(e) => setemployeDetails({...employeDetails, email:e.target.value})}></TextField>
            </TableCell>
            <TableCell>
              <TextField value={employeDetails.payscale} onChange={(e) => setemployeDetails({...employeDetails, payscale:e.target.value})}></TextField>
            </TableCell>
           </Table>
      </Drawer>
      <Drawer>
           <Table>
            <TableCell>
              <TextField value={editemployeDetails.name} onChange={(e) => setEditemployeDetails({...editemployeDetails, name:e.target.value})}></TextField>
            </TableCell>
            <TableCell>
              <TextField value={editemployeDetails.designation} onChange={(e) => setEditemployeDetails({...editemployeDetails, designation:e.target.value})}></TextField>
            </TableCell>
            <TableCell>
              <TextField value={editemployeDetails.salary} onChange={(e) => setEditemployeDetails({...editemployeDetails, salary:e.target.value})}></TextField>
            </TableCell>
            <TableCell>
              <TextField value={editemployeDetails.number} onChange={(e) => setEditemployeDetails({...editemployeDetails, number:e.target.value})}></TextField>
            </TableCell>
            <TableCell>
              <TextField value={editemployeDetails.email} onChange={(e) => setEditemployeDetails({...editemployeDetails, email:e.target.value})}></TextField>
            </TableCell>
            <TableCell>
              <TextField value={editemployeDetails.payscale} onChange={(e) => setEditemployeDetails({...editemployeDetails, payscale:e.target.value})}></TextField>
            </TableCell>
           </Table>
      </Drawer>
    </>
  )
}

export default EmployeDetails;