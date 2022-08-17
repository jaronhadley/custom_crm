const inquirer = require("inquirer");
const mysql = require('mysql2');
const cTable = require('console.table');
require('dotenv').config();

// Connect to database
const db = mysql.createConnection(
    {
      host: 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    console.log(`Connected to the ${process.env.DB_NAME} database.`)
  );

// list of menu questions
menuChoices = [{
                type: 'list',
                name: 'menuChoice',
                message: 'What would you like to do?',
                choices: ['View Departments','Add Department','Remove Department','View Roles','Add Role','Remove Role','View Employees','Add Employee','Remove Employee','Update Employee Role','View Financial Report','Exit']
               }
]
 
function init() {
// Initializes the menu with selection
    inquirer.prompt(menuChoices)
        .then((menuAnswer) => {
            switch(menuAnswer.menuChoice) {
                case 'View Departments':
                    viewAll('departments')
                    break;
                case 'Add Department':
                    addDepartment()
                    break;
                case 'Remove Department':
                    removeDepartment();
                    break;
                case 'View Roles':
                    viewAll('roles');
                    break;
                case 'Add Role':
                    addRole();
                    break;
                case 'Remove Role':
                    removeRole();
                    break;
                case 'View Employees':
                    viewAll('employees');
                    break;
                case 'Add Employee':
                    addEmployee();
                    break;
                case 'Update Employee Role':
                    updateEmployee();
                    break;
                case 'Remove Employee':
                    removeEmployee();
                    break;
                case 'View Financial Report':
                    viewAll('finance');
                    break;
                case 'Exit':
                    break;
                default:
                    init();
            }
        })
}

function addDepartment() {
    // function to add a new department
    inquirer.prompt([{type:'input',name:'deptName',message:'What is the name of the new department?'}])
        .then((newDept) =>{
            // given user input insert new dept into dept table
            db.query(`insert into departments (name) values ('${newDept.deptName}')`)
            console.log(`Added ${newDept.deptName} department to database`)
        })
        .then((results) => {
            init();
        })
}
async function removeDepartment() {
    // get list of active departments
    const stuff = await db.promise().query('select * from departments');
    const depts = [];
    // add department names to list for display to user
    stuff[0].forEach((dept) => {
        depts.push(dept.name);
    })
    inquirer.prompt({type:'list',name:'deptName',message:'Which role would you like to remove?',choices:depts})
        .then(async (remDept) => {
            // delete the selected department
            await db.promise().query(`delete from departments where name = '${remDept.deptName}'`)
            console.log(`removed ${remDept.deptName} from roles`);
            init();
        })
}
async function addRole() {
    // get list of active departements to help assign role to correct department id
    const stuff = await db.promise().query('select * from departments');
    const depts = [];
    stuff[0].forEach((dept) => {
        depts.push(dept.name);
    })
    inquirer.prompt([{type:'input',name:'roleName',message:'What is the title of the new employee role?'},
                      {type:'input',name:'roleSalary',message:'What is expected salary of the new employee role?'},
                    {type:'list',name:'deptName',message:'Which department does this role belong to?',choices:depts}])
        .then(async (newRole) => {
            // find department id associated with the department selected by the user
            let id =0;
            stuff[0].forEach((dept) => {
                if(dept.name==newRole.deptName){
                    id = dept.id;
                }
            })
            // insert new role into roles table
            await db.promise().query(`insert into roles (title, salary, department_id) values ('${newRole.roleName}',${newRole.roleSalary},${id})`)
            console.log(`Added ${newRole.roleName} role to database`)
            init();
        })
}
async function removeRole() {
// get list of active roles
    const stuff = await db.promise().query('select * from roles');
    const roles = [];
    stuff[0].forEach((role) => {
        roles.push(role.title);
    })
    inquirer.prompt({type:'list',name:'roleName',message:'Which role would you like to remove?',choices:roles})
        .then((remRole) => {
            // delete role selected by user
            db.query(`delete from roles where title = '${remRole.roleName}'`)
            console.log(`removed ${remRole.roleName} from roles`);
            init();
        })
}
async function addEmployee() {
    // get list of active roles
    const roles = await db.promise().query('select * from roles');
    const role = [];
    roles[0].forEach((val) => {
        role.push(val.title);
    })
    // get list of employees who could be managers
    const mgrs = await db.promise().query("select id, CONCAT(first_name, concat(' ', last_name)) mgr_name from employees");
    const mgr = [];
    mgrs[0].forEach((val) => {
        mgr.push(val.mgr_name);
    })
    mgr.push('No Manager')
    inquirer.prompt([{type:'input',name:'empFirst',message:"What is the new employee's first name?"},
                      {type:'input',name:'empLast',message:"What is the new employee's last name?"},
                    {type:'list',name:'roleName',message:'Which role will this employee fill?',choices:role},
                    {type:'list',name:'mgrName',message:'Which manager, if any, will this employee report to?',choices:mgr},
                ])
        .then(async (newEmp) => {
            // find id for selected employee
            let roleId =0;
            roles[0].forEach((dept) => {
                if(dept.title==newEmp.roleName){
                    roleId = dept.id;
                }
            })
            // if no manager is selected it should default to null
            let mgrId = null;
            mgrs[0].forEach((magr) => {
                if(magr.mgr_name==newEmp.mgrName){
                    mgrId = magr.id;
                }
            })
            // insert new employee with assigned role and manager id
            await db.promise().query(`insert into employees (first_name, last_name, role_id, manager_id) values ('${newEmp.empFirst}','${newEmp.empLast}',${roleId},${mgrId})`)
            console.log(`Added employee ${newEmp.empFirst} ${newEmp.empLast} to database`)
        }).then((things) => {
            init();
        })
}
async function removeEmployee() {
    // get list of current employees
    const stuff = await db.promise().query("select id, CONCAT(first_name, concat(' ', last_name)) emp_name from employees");
    const emps = [];
    stuff[0].forEach((role) => {
        emps.push(role.emp_name);
    })
    inquirer.prompt({type:'list',name:'empName',message:'Which employee would you like to remove?',choices:emps})
        .then(async (remEmp) => {
            // get id for the associated name selected by user
            let empId =0;
            stuff[0].forEach((dept) => {
                if(dept.emp_name==remEmp.empName){
                    empId = dept.id;
                }
            })
            // delete selected employee from employee table
            await db.promise().query(`delete from employees where id = '${empId}'`)
            console.log(`removed ${remEmp.empName} from employees`);
            init();
        })
}
async function updateEmployee() {
    // get active employees
    const stuff = await db.promise().query("select id, CONCAT(first_name, concat(' ', last_name)) emp_name from employees");
    const emps = [];
    stuff[0].forEach((role) => {
        emps.push(role.emp_name);
    })
    // get active roles
    const empRole = await db.promise().query('select * from roles');
    const roles = [];
    empRole[0].forEach((role) => {
        roles.push(role.title);
    })
    // ask for employee and role to update
    inquirer.prompt([{type:'list',name:'empName',message:'Which employee would you change roles?',choices:emps},
                    {type:'list',name:'roleName',message:'Which role would you like to assign?',choices:roles}])
        .then(async (remEmp) => {
            // find id for selected employee
            let empId =0;
            stuff[0].forEach((dept) => {
                if(dept.emp_name==remEmp.empName){
                    empId = dept.id;
                }
            })
            // find id for selected role
            let roleId =0;
            empRole[0].forEach((role) => {
                if(role.title==remEmp.roleName){
                    roleId = role.id;
                }
            })
            // update with information selected by user
            await db.promise().query(`update employees set role_id = ${roleId} where id = ${empId}`)
            console.log(`updated ${remEmp.empName} role to ${remEmp.roleName}`);
            init();
        })
}
async function viewAll(view) {
    // Add functions passed to viewAll have a specific query to perform and output
    switch (view) {
        case 'departments':
            const dept = await db.promise().query('select * from departments');
            console.table(dept[0]);
            break;
        case 'roles':
            const rol = await db.promise().query('select r.id, r.title, d.name department, r.salary from roles r join departments d on r.department_id = d.id order by d.name');
            console.table(rol[0]);
            break;
        case 'employees':
            // we allow for the employee report to be demonstrated as by employee, manager and department
            await inquirer.prompt([{type:'list',name:'rptType',message:'How would you like to view employee data?',choices:['By Department','By Manager','All Employee Data']}])
                .then(async (zults) => {
                    if(zults.rptType=='By Department'){
                        let emps = null;
                        emps = await db.promise().query(`select d.name, r.title, e.id emp_id, e.first_name, e.last_name 
                                                         from employees e 
                                                         join roles r on r.id = e.role_id
                                                         join departments d on d.id = r.department_id
                                                         order by d.name`);
                        console.table(emps[0]);
                    } else if (zults.rptType=='By Manager'){
                        let emps = null;
                        emps = await db.promise().query(`select distinct m.id mgr_id, m.first_name mgr_first_name, m.last_name mgr_last_name, mr.title mgr_title, e.id emp_id, e.first_name emp_first_name, e.last_name emp_last_name, r.title emp_title
                                                            from employees e 
                                                            join roles r on r.id = e.role_id
                                                            join departments d on d.id = r.department_id
                                                            left join employees m
                                                            on e.manager_id = m.id
                                                            left join roles mr
                                                            on m.role_id = mr.id
                                                            where m.id is not null
                                                            order by m.id`);
                        console.table(emps[0]);                                  
                    } else {
                        let emps = null;
                        emps = await db.promise().query(`select e.id emp_id, e.first_name, e.last_name, r.title, d.name department, r.salary, CONCAT(m.first_name, concat(' ', m.last_name)) mgr_name
                                                            from employees e 
                                                            join roles r on r.id = e.role_id
                                                            join departments d on d.id = r.department_id
                                                            left join employees m
                                                            on e.manager_id = m.id
                                                            left join roles mr
                                                            on m.role_id = mr.id
                                                            order by d.name`);
                        console.table(emps[0]);   
                    }
                })
            break;
        case 'finance':
            // final financial report that shows the employee count and salary by department
            let fin = null;
            fin = await db.promise().query(`select d.name dept_name, count(e.id) head_count, sum(r.salary) total_salary
                                                from employees e 
                                                join roles r on r.id = e.role_id
                                                join departments d on d.id = r.department_id
                                                group by d.name
                                                order by d.name`);
            console.table(fin[0]);   
    }
    init();
}

init();