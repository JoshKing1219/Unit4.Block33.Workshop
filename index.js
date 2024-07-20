const express = require("express");
const pg = require("pg");

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);

const server = express();

const init = async () => {
  await client.connect();
  console.log("client connected");

  let SQL = `
        DROP TABLE IF EXISTS employee;
        DROP TABLE IF EXISTS department;

        CREATE TABLE department(
        id SERIAL PRIMARY KEY,
        name VARCHAR(250)
        );

        CREATE TABLE employee(
        id SERIAL PRIMARY KEY,
        name VARCHAR(250) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES department(id) NOT NULL
        );
    `;
  await client.query(SQL);
  console.log("tables created");

  SQL = `
    INSERT INTO department(name) VALUES('Human Resources');
    INSERT INTO department(name) VALUES('Management');
    INSERT INTO department(name) VALUES('R&D');
    INSERT INTO department(name) VALUES('Sales');
    INSERT INTO department(name) VALUES('Accounting');
    INSERT INTO department(name) VALUES('IT');
    INSERT INTO department(name) VALUES('Public Relations');

    INSERT INTO employee(name, department_id) VALUES('John Smirgth', (SELECT id FROM department WHERE name='IT'));
    INSERT INTO employee(name, department_id) VALUES('Karen Mort-Lornan', (SELECT id FROM department WHERE name='Human Resources'));
    INSERT INTO employee(name, department_id) VALUES('Darian Rosewood', (SELECT id FROM department WHERE name='Management'));
    INSERT INTO employee(name, department_id) VALUES('Henry Cultish', (SELECT id FROM department WHERE name='R&D'));
    INSERT INTO employee(name, department_id) VALUES('Morgan Wernil', (SELECT id FROM department WHERE name='Human Resources'));
    INSERT INTO employee(name, department_id) VALUES('Norman Norville', (SELECT id FROM department WHERE name='Public Relations'));
    INSERT INTO employee(name, department_id) VALUES('Henrietta Sampson', (SELECT id FROM department WHERE name='IT'));
    INSERT INTO employee(name, department_id) VALUES('Nicole Smirgth', (SELECT id FROM department WHERE name='Accounting'));
    INSERT INTO employee(name, department_id) VALUES('Valerie Randall', (SELECT id FROM department WHERE name='Sales'));
    INSERT INTO employee(name, department_id) VALUES('Randall Randall', (SELECT id FROM department WHERE name='Sales'));
    INSERT INTO employee(name, department_id) VALUES('Burt Lornan', (SELECT id FROM department WHERE name='Management'));
  `;

  await client.query(SQL);
  console.log("tables seeded");

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

init();

server.use(express.json());
server.use(require("morgan")("dev"));

server.get("/api/department", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM department ORDER BY name ASC;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
server.get("/api/employee", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employee ORDER BY name ASC;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
server.post("/api/employee", async (req, res, next) => {
  try {
    const { name, department_id } = req.body;

    const SQL = `INSERT INTO employee(name, department_id) VALUES($1, $2) RETURNING *`;
    const response = await client.query(SQL, [name, department_id]);
    res.status(201).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
server.put("/api/employee/:id", async (req, res, next) => {
  try {
    const { name, department_id } = req.body;

    const SQL = `UPDATE employee SET name=$1, department_id=$2, updated_at=now() WHERE id=$3 RETURNING *;`;
    const response = await client.query(SQL, [
      name,
      department_id,
      req.params.id,
    ]);

    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
server.delete("/api/employee/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM employee WHERE id=$1;`;
    await client.query(SQL, [req.params.id]);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

server.use((err, req, res) => {
  res.status(res.status || 500).send({ error: err });
});
