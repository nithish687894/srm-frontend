## sem 3/Numerical Methods & Analysis/PYQs/All University Exam PYQs.url

CATEGORY: PYQs
STATUS: url_reference_only

URL: https://drive.google.com/drive/folders/1DduTDNRSTizjtkJZ_VSRFzdcXrPTDF9x?usp=sharing

---

## sem 3/Numerical Methods & Analysis/PYQs/Formulas (Unit 1 to 5).pdf

CATEGORY: PYQs
STATUS: ok

[Page 1]
Page 1 of 8 
 
FORMULA SHEET FOR NUMERICAL METHODS FOR ENGINEERS 
 
 
Part 1: Modeling, Computers and Error Analysis 
 
Error Definitions 
 
True error: 
True percent relative error: 
 
 
Approximate percent relative error: 
 
 
Stopping criterion: 
Terminate computation when εa < εs where εs is the desired percent relative error 
 
 
Taylor Series 
 
Taylor series expansion 
 
 ( ) ( ) ( ) ( )
 ( )
 ( )( )
 
 
where remainder 
 
 
 ( )( )
( ) or ( ) 
 
 
Error propagation 
 
For n independent variables x1, x2, …, xn having errors ̃ , ̃ , …, ̃ , the error in the 
function f can be estimated via 
 
 | 
 
| ̃ | 
 
| ̃ | 
 
| ̃ 
 
 

[Page 2]
 COEB223 / MATB324 Formula Sheet 
Page 2 of 8 
 
Part 2: Roots of Equations 
 
Method Formulation 
Bisection 
 If ( ) ( ) set 
If ( ) ( ) set 
 
False Position ( )( )
 ( ) ( ) If ( ) ( ) set 
If ( ) ( ) set 
 
Newton Raphson ( )
 ( ) 
Secant 
 ( )( )
 ( ) ( ) 
 
 
 
Part 3: Linear Algebraic Equations 
 
 
Gauss Elimination 
 
[
 
 
 
] [
 
 
 
] 
 
 
 
 
 
 
 
 
 
LU decomposition 
 
 
 
 
 
[
 
 
 
] [
 
 
 
]{
 
 
 
} {
 
 
 
} [
 
 
 
]{
 
 
 
} {
 
 
 
} {
 
 
 
} 
 
 
 
Decomposition 
 Back Substitution 
Forward Substitution 

[Page 3]
 COEB223 / MATB324 Formula Sheet 
Page 3 of 8 
 
Gauss-Seidel method 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 }
 
 
 
 
 
 
| 
 
 
 
 | 
 
 
 
With relaxation, 
 
 
 ( ) 
 
 
Part 4: Curve Fitting 
 
Method Formulation Errors 
Linear 
Regression 
 
 
 
 
 
 
 
where 
 ∑( ) 
 
 
 
 ∑ ∑ ∑ 
 ∑ 
 (∑ ) 
 
 √ 
 
 
 
 
 
where: 
 ∑( ̅) 
 
Polynomial 
Regression 
 
For a 2nd order polynomial fit, 
 
where 
 ∑( 
 ) 
 
 
 
by differentiating Sr with respect to each coefficients 
and setting the partial derivatives equal to zero, we 
have: 
[
 
 
 
 
 ∑ ∑ 
 
∑ ∑ 
 ∑ 
 
∑ 
 ∑ 
 ∑ 
 
]
 
 
 
 
 
{
 
 
 
} 
{
 
 
 
 ∑ 
∑ 
∑ 
 }
 
 
 
 
 
 
 √ 
 ( ) 
 
 
 
 
where: 
 ∑( ̅) 
 
 

[Page 4]
 COEB223 / MATB324 Formula Sheet 
Page 4 of 8 
 
Multiple 
Linear 
Regression 
 
 
For a two-variable linear fit, 
 
where 
 ∑( ) 
 
 
 
by differentiating Sr with respect to each coefficients 
and setting the partial derivatives equal to zero, we 
have: 
 
[
 
 
 
 
 ∑ ∑ 
∑ ∑ 
 ∑ 
∑ ∑ ∑ 
 
]
 
 
 
 
 
{
 
 
 
} 
{
 
 
 
 ∑ 
∑ 
∑ }
 
 
 
 
 
 
 √ 
 ( ) 
 
 
 
 
where: 
 ∑( ̅) 
 
 
 
Newton’s 
divided 
difference 
interpolating 
polynomial 
 
For third order: 
 ( ) ( ) ( )( )
 ( )( )( ) 
where 
 ( ) 
 [ ] 
 [ ] 
 [ ] 
 
 
Lagrange 
interpolating 
polynomial 
 
 ( ) ∑ ( ) ( )
 
 
 
where, 
 ( ) ∏ 
 
 
 
 
 
 
 
 
 
 
 
 

[Page 5]
 COEB223 / MATB324 Formula Sheet 
Page 5 of 8 
 
Part 6: Numerical Differentiation and Integration 
 
 
A. Numerical Differentiation 
 
Method Formulation Errors 
Forward finite-
divided difference 
First Derivative: 
 ( ) ( ) ( )
 
 ( ) 
 ( ) ( ) ( ) ( )
 
 
 
 ( ) 
 
Backward finite-
divided difference 
 
First Derivative: 
 ( ) ( ) ( )
 
 ( ) 
 ( ) ( ) ( ) ( )
 
 
 
 ( ) 
 
Centred finite-
divided difference 
 
First Derivative 
 ( ) ( ) ( )
 
 ( ) 
 ( ) ( ) ( ) ( ) ( )
 ( ) 
 
 
B. Numerical Integration 
 
Method Formulation 
Trapezoidal rule ( ) ( ) ( )
 
 
Multiple-application 
trapezoidal rule ( )
 ( ( ) ∑ ( )
 
 
 ( )) 

[Page 6]
 COEB223 / MATB324 Formula Sheet 
Page 6 of 8 
 
Simpson’s 1/3 rule ( ) ( ) ( ) ( )
 
 
Multiple-application 
Simpson’s 1/3 rule 
( )
 ( ( ) ∑ ( )
 
 
 ∑ ( )
 
 
 ( )) 
 
Simpson’s 3/8 rule ( ) ( ) ( ) ( ) ( )
 
 
 
Gauss Quadrature 
Gauss-Legendre 
 ( ) ( ) ( ) 
 
For two-point Gauss-Legendre: 
 
 
 
 
 
 
For three-point Gauss-Legendre: 
 
 
 
 
 
 
 
 
Change of variables: 
 
( ) ( ) 
 
 
 
 

[Page 7]
 COEB223 / MATB324 Formula Sheet 
Page 7 of 8 
 
Part 7: Ordinary Differential Equations 
 
Method Formulation 
Euler’s First-Order RK 
 ( ) 
 
Heun’s Second Order RK ( 
 
 ) 
 ( ) 
 ( ) 
 
Midpoint Second Order RK 
 ( ) 
 ( 
 
 ) 
 
Ralston’s Second Order RK ( 
 
 ) 
 ( ) 
 ( 
 
 ) 
 
Classical Fourth Order RK 
 ( ) 
 ( ) 
 ( 
 
 ) 
 ( 
 
 ) 
 ( ) 
 
 
 

[Page 8]
 COEB223 / MATB324 Formula Sheet 
Page 8 of 8 
 
Part 8: Partial Differential Equations 
 
Method Formulation 
Elliptic PDEs 
Liebmann’s Method 
 
 
 
 
Parabolic PDEs (one 
dimensional) 
Explicit Method 
 
 
 
 ( 
 
 
 ) 
 
( ) 
 
Simple Implicit Method 
 ( ) 
 
 
 
 
( ) 
 
Crank-Nicolson Method 
 ( ) 
 
 
 
 ( ) 
 
 
 
( )

---

## sem 3/Numerical Methods & Analysis/PYQs/MCQs.url

CATEGORY: PYQs
STATUS: url_reference_only

URL: https://drive.google.com/drive/folders/1xO6rFS6EoYzRR95Gi3vkzWnkWda43K5d?usp=sharing
