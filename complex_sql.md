# QueryCraft — Complex SQL Statements for Engine Testing

---

## 🎬 Sakila Database

### 1. Top 5 Actors by Total Film Revenue (JOIN + GROUP BY + Subquery)
```sql
SELECT a.first_name, a.last_name, COUNT(r.rental_id) AS total_rentals,
       SUM(p.amount) AS total_revenue
FROM actor a
JOIN film_actor fa ON a.actor_id = fa.actor_id
JOIN film f ON fa.film_id = f.film_id
JOIN inventory i ON f.film_id = i.film_id
JOIN rental r ON i.inventory_id = r.inventory_id
JOIN payment p ON r.rental_id = p.rental_id
GROUP BY a.actor_id, a.first_name, a.last_name
ORDER BY total_revenue DESC
LIMIT 5;
```

### 2. Monthly Revenue Trend Per Store (Window Function + DATE_FORMAT)
```sql
SELECT s.store_id,
       DATE_FORMAT(p.payment_date, '%Y-%m') AS month,
       SUM(p.amount) AS monthly_revenue,
       SUM(SUM(p.amount)) OVER (PARTITION BY s.store_id ORDER BY DATE_FORMAT(p.payment_date, '%Y-%m')) AS cumulative_revenue
FROM payment p
JOIN rental r ON p.rental_id = r.rental_id
JOIN inventory i ON r.inventory_id = i.inventory_id
JOIN store s ON i.store_id = s.store_id
GROUP BY s.store_id, month
ORDER BY s.store_id, month;
```

### 3. Customers Who Rented Every Film in a Specific Category (NOT EXISTS + Correlated Subquery)
```sql
SELECT c.first_name, c.last_name
FROM customer c
WHERE NOT EXISTS (
    SELECT f.film_id
    FROM film f
    JOIN film_category fc ON f.film_id = fc.film_id
    JOIN category cat ON fc.category_id = cat.category_id
    WHERE cat.name = 'Action'
    AND NOT EXISTS (
        SELECT 1 FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        WHERE i.film_id = f.film_id AND r.customer_id = c.customer_id
    )
);
```

### 4. Film Rental Ranking Within Each Category (RANK + CTE)
```sql
WITH film_rentals AS (
    SELECT f.title, cat.name AS category,
           COUNT(r.rental_id) AS rental_count
    FROM film f
    JOIN film_category fc ON f.film_id = fc.film_id
    JOIN category cat ON fc.category_id = cat.category_id
    JOIN inventory i ON f.film_id = i.film_id
    JOIN rental r ON i.inventory_id = r.inventory_id
    GROUP BY f.film_id, f.title, cat.name
)
SELECT title, category, rental_count,
       RANK() OVER (PARTITION BY category ORDER BY rental_count DESC) AS rank_in_category
FROM film_rentals
WHERE RANK() OVER (PARTITION BY category ORDER BY rental_count DESC) <= 3;
```

### 5. Customers with Above-Average Spending Per City (HAVING + Nested AVG)
```sql
SELECT ci.city, c.first_name, c.last_name,
       ROUND(SUM(p.amount), 2) AS total_spent
FROM customer c
JOIN payment p ON c.customer_id = p.customer_id
JOIN address a ON c.address_id = a.address_id
JOIN city ci ON a.city_id = ci.city_id
GROUP BY ci.city, c.customer_id, c.first_name, c.last_name
HAVING total_spent > (
    SELECT AVG(total) FROM (
        SELECT SUM(p2.amount) AS total
        FROM payment p2 GROUP BY p2.customer_id
    ) AS avg_sub
)
ORDER BY ci.city, total_spent DESC;
```

---

## 🌍 World Database

### 1. Countries with Life Expectancy Above Their Continent Average (CTE + AVG Window)
```sql
WITH continent_avg AS (
    SELECT Continent,
           AVG(LifeExpectancy) AS avg_life_exp
    FROM Country
    WHERE LifeExpectancy IS NOT NULL
    GROUP BY Continent
)
SELECT c.Name, c.Continent, c.LifeExpectancy,
       ROUND(ca.avg_life_exp, 2) AS continent_avg,
       ROUND(c.LifeExpectancy - ca.avg_life_exp, 2) AS diff_from_avg
FROM Country c
JOIN continent_avg ca ON c.Continent = ca.Continent
WHERE c.LifeExpectancy > ca.avg_life_exp
ORDER BY diff_from_avg DESC;
```

### 2. Top 3 Most Spoken Languages Per Continent (RANK + Window Function)
```sql
WITH lang_speakers AS (
    SELECT co.Continent, cl.Language,
           SUM(co.Population * cl.Percentage / 100) AS total_speakers,
           RANK() OVER (PARTITION BY co.Continent ORDER BY SUM(co.Population * cl.Percentage / 100) DESC) AS lang_rank
    FROM CountryLanguage cl
    JOIN Country co ON cl.CountryCode = co.Code
    GROUP BY co.Continent, cl.Language
)
SELECT Continent, Language,
       ROUND(total_speakers) AS total_speakers, lang_rank
FROM lang_speakers
WHERE lang_rank <= 3
ORDER BY Continent, lang_rank;
```

### 3. Countries Whose Capital is Their Largest City (JOIN + Subquery Filter)
```sql
SELECT co.Name AS country,
       ci.Name AS capital_city,
       ci.Population AS capital_population
FROM Country co
JOIN City ci ON co.Capital = ci.ID
WHERE ci.Population = (
    SELECT MAX(c2.Population)
    FROM City c2
    WHERE c2.CountryCode = co.Code
)
ORDER BY capital_population DESC;
```

### 4. GDP Per Capita vs Literacy Rate Correlation View (CASE + Computed Columns)
```sql
SELECT Name,
       ROUND(GNP / NULLIF(Population, 0) * 1000, 2) AS gdp_per_capita,
       Literacy,
       CASE
           WHEN Literacy >= 95 THEN 'High Literacy'
           WHEN Literacy >= 75 THEN 'Medium Literacy'
           WHEN Literacy >= 50 THEN 'Low Literacy'
           ELSE 'Very Low / Unknown'
       END AS literacy_tier,
       CASE
           WHEN GNP / NULLIF(Population, 0) * 1000 > 20 THEN 'High Income'
           WHEN GNP / NULLIF(Population, 0) * 1000 > 5 THEN 'Middle Income'
           ELSE 'Low Income'
       END AS income_tier
FROM Country
WHERE Population > 1000000
ORDER BY gdp_per_capita DESC;
```

### 5. Regions with Most Official Languages and Population Coverage (GROUP BY + HAVING + COUNT)
```sql
SELECT co.Region,
       COUNT(DISTINCT cl.Language) AS official_language_count,
       SUM(co.Population) AS total_population,
       GROUP_CONCAT(DISTINCT cl.Language ORDER BY cl.Language SEPARATOR ', ') AS official_languages
FROM CountryLanguage cl
JOIN Country co ON cl.CountryCode = co.Code
WHERE cl.IsOfficial = 'T'
GROUP BY co.Region
HAVING official_language_count >= 3
ORDER BY official_language_count DESC, total_population DESC;
```

---

## 🚗 ClassicModels Database

### 1. Sales Rep Performance: Revenue vs Target with Rank (CTE + Window Function)
```sql
WITH rep_sales AS (
    SELECT e.employeeNumber, e.firstName, e.lastName,
           e.jobTitle, o2.city AS office_city,
           SUM(od.quantityOrdered * od.priceEach) AS total_revenue,
           COUNT(DISTINCT o.orderNumber) AS total_orders
    FROM employees e
    JOIN customers c ON e.employeeNumber = c.salesRepEmployeeNumber
    JOIN orders o ON c.customerNumber = o.customerNumber
    JOIN orderdetails od ON o.orderNumber = od.orderNumber
    JOIN offices o2 ON e.officeCode = o2.officeCode
    WHERE e.jobTitle = 'Sales Rep'
    GROUP BY e.employeeNumber, e.firstName, e.lastName, e.jobTitle, o2.city
)
SELECT firstName, lastName, office_city, total_revenue, total_orders,
       RANK() OVER (ORDER BY total_revenue DESC) AS revenue_rank
FROM rep_sales
ORDER BY revenue_rank;
```

### 2. Products Never Ordered (LEFT JOIN + IS NULL)
```sql
SELECT p.productCode, p.productName, p.productLine,
       p.quantityInStock, p.buyPrice
FROM products p
LEFT JOIN orderdetails od ON p.productCode = od.productCode
WHERE od.productCode IS NULL
ORDER BY p.quantityInStock DESC;
```

### 3. Monthly Order Revenue with Running Total (Window Function + DATE_FORMAT)
```sql
SELECT
    DATE_FORMAT(o.orderDate, '%Y-%m') AS order_month,
    COUNT(DISTINCT o.orderNumber) AS total_orders,
    ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS monthly_revenue,
    ROUND(SUM(SUM(od.quantityOrdered * od.priceEach)) OVER (
        ORDER BY DATE_FORMAT(o.orderDate, '%Y-%m')
    ), 2) AS running_total
FROM orders o
JOIN orderdetails od ON o.orderNumber = od.orderNumber
GROUP BY order_month
ORDER BY order_month;
```

### 4. Customers Who Spent More Than Their Credit Limit (Subquery + HAVING)
```sql
SELECT c.customerName, c.country,
       c.creditLimit,
       ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS total_purchased,
       ROUND(SUM(od.quantityOrdered * od.priceEach) - c.creditLimit, 2) AS over_limit_by
FROM customers c
JOIN orders o ON c.customerNumber = o.customerNumber
JOIN orderdetails od ON o.orderNumber = od.orderNumber
GROUP BY c.customerNumber, c.customerName, c.country, c.creditLimit
HAVING total_purchased > c.creditLimit
ORDER BY over_limit_by DESC;
```

### 5. Product Line Revenue Share with Percentage (CTE + RATIO_TO_REPORT Simulation)
```sql
WITH product_line_revenue AS (
    SELECT p.productLine,
           ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS line_revenue
    FROM products p
    JOIN orderdetails od ON p.productCode = od.productCode
    GROUP BY p.productLine
),
total AS (
    SELECT SUM(line_revenue) AS grand_total FROM product_line_revenue
)
SELECT plr.productLine, plr.line_revenue,
       ROUND((plr.line_revenue / t.grand_total) * 100, 2) AS revenue_percentage,
       RANK() OVER (ORDER BY plr.line_revenue DESC) AS revenue_rank
FROM product_line_revenue plr, total t
ORDER BY revenue_rank;
```

---

## 🧑‍💼 Employees Database

### 1. Top 5 Highest Paid Employees Per Department (CTE + DENSE_RANK)
```sql
WITH dept_salary_rank AS (
    SELECT e.emp_no, e.first_name, e.last_name,
           d.dept_name,
           s.salary,
           DENSE_RANK() OVER (PARTITION BY d.dept_name ORDER BY s.salary DESC) AS salary_rank
    FROM employees e
    JOIN dept_emp de ON e.emp_no = de.emp_no AND de.to_date = '9999-01-01'
    JOIN departments d ON de.dept_no = d.dept_no
    JOIN salaries s ON e.emp_no = s.emp_no AND s.to_date = '9999-01-01'
)
SELECT emp_no, first_name, last_name, dept_name, salary, salary_rank
FROM dept_salary_rank
WHERE salary_rank <= 5
ORDER BY dept_name, salary_rank;
```

### 2. Average Salary Growth Per Department Over the Years (GROUP BY + Window)
```sql
SELECT d.dept_name,
       YEAR(s.from_date) AS salary_year,
       ROUND(AVG(s.salary), 2) AS avg_salary,
       ROUND(AVG(s.salary) - LAG(ROUND(AVG(s.salary), 2)) OVER (
           PARTITION BY d.dept_name ORDER BY YEAR(s.from_date)
       ), 2) AS yoy_change
FROM salaries s
JOIN dept_emp de ON s.emp_no = de.emp_no
JOIN departments d ON de.dept_no = d.dept_no
GROUP BY d.dept_name, salary_year
ORDER BY d.dept_name, salary_year;
```

### 3. Employees with Multiple Title Changes (Subquery + COUNT + HAVING)
```sql
SELECT e.emp_no, e.first_name, e.last_name,
       COUNT(t.title) AS title_changes,
       GROUP_CONCAT(t.title ORDER BY t.from_date SEPARATOR ' → ') AS career_path
FROM employees e
JOIN titles t ON e.emp_no = t.emp_no
GROUP BY e.emp_no, e.first_name, e.last_name
HAVING title_changes > 2
ORDER BY title_changes DESC
LIMIT 20;
```

### 4. Managers Who Earned Less Than Their Department's Average Employee Salary (Nested Subquery)
```sql
SELECT e.emp_no, e.first_name, e.last_name,
       d.dept_name,
       s.salary AS manager_salary,
       ROUND(dept_avg.avg_emp_salary, 2) AS dept_avg_salary
FROM dept_manager dm
JOIN employees e ON dm.emp_no = e.emp_no
JOIN departments d ON dm.dept_no = d.dept_no
JOIN salaries s ON e.emp_no = s.emp_no AND s.to_date = '9999-01-01'
JOIN (
    SELECT de.dept_no, AVG(sal.salary) AS avg_emp_salary
    FROM dept_emp de
    JOIN salaries sal ON de.emp_no = sal.emp_no
    WHERE sal.to_date = '9999-01-01' AND de.to_date = '9999-01-01'
    GROUP BY de.dept_no
) AS dept_avg ON dm.dept_no = dept_avg.dept_no
WHERE dm.to_date = '9999-01-01'
  AND s.salary < dept_avg.avg_emp_salary
ORDER BY dept_name;
```

### 5. Gender Pay Gap Per Department (CASE + AVG + Pivot Simulation)
```sql
SELECT d.dept_name,
       ROUND(AVG(CASE WHEN e.gender = 'M' THEN s.salary END), 2) AS avg_male_salary,
       ROUND(AVG(CASE WHEN e.gender = 'F' THEN s.salary END), 2) AS avg_female_salary,
       ROUND(AVG(CASE WHEN e.gender = 'M' THEN s.salary END) -
             AVG(CASE WHEN e.gender = 'F' THEN s.salary END), 2) AS pay_gap,
       COUNT(DISTINCT CASE WHEN e.gender = 'M' THEN e.emp_no END) AS male_count,
       COUNT(DISTINCT CASE WHEN e.gender = 'F' THEN e.emp_no END) AS female_count
FROM employees e
JOIN dept_emp de ON e.emp_no = de.emp_no AND de.to_date = '9999-01-01'
JOIN departments d ON de.dept_no = d.dept_no
JOIN salaries s ON e.emp_no = s.emp_no AND s.to_date = '9999-01-01'
GROUP BY d.dept_name
ORDER BY pay_gap DESC;
```
