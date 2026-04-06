---

# 📄 **EXAM 1**

## 1. Turing Machine [10 points]

Describe a Turing machine that solves:

> ( L(x)=1 ) if input ( x ) is of the form ( a^k b^k a^k ) for some ( k \ge 0 )
> ( L(x)=0 ) otherwise

Use the standard model (one tape, input written initially, rest blank).

Describe at the level of:

* TM program (diagram or command list)

---

## 2. Reductions and Partial Decidability [10 points]

Given:

* TM program ( M )
* input strings ( x ) and ( y )

Define:

> ANSWER01(M, x, y) = 1
> if ( M ) accepts ( x ) but rejects ( y )

Tasks:

a) Show reduction:

```
ACCEPTING ≤ ANSWER01
```

b) Prove:

```
ANSWER01 is partially decidable
```

---

## 3. TM Running Time [10 points]

Problem:

> ( L(x)=1 ) if ( x ) is of the form ( a^k b^{2k} )

Machine behavior:

Repeat:

1. If first non-erased symbol is blank → **accept**
2. If symbol is `a`:

   * erase it
   * move right to first blank
   * move left, check symbol is `b`, erase it, else reject
   * move left again, check symbol is `b`, erase it, else reject
   * return to start
3. If symbol is not blank or `a` → **reject**

Task:

* Analyze time complexity ( O(f(n)) )

---

## 4. NP Definition [10 points]

Input:

* numbers ( x_1, ..., x_n )

Problem:

> Can they be split into 2 groups with equal sums?

Task:

* Prove problem is in NP
* Describe:

  * verification algorithm
  * additional information (certificate)

---

# 📄 **EXAM 2**

## 1. Turing Machine [10 points]

> ( L(x)=1 ) if string contains more `a` than `b`

Describe:

* TM program (standard model)

---

## 2. Halting Problem Variant [10 points]

Given:

* two TMs ( M_1, M_2 )
* input ( x )

Define:

> HALTING2 = 1 if BOTH ( M_1 ) and ( M_2 ) halt on ( x )

Tasks:

a) Show:

```
HALTING ≤ HALTING2
```

b) Prove:

```
HALTING2 is partially decidable
```

---

## 3. TM Running Time [10 points]

Problem:

> ( L(x)=1 ) if at least half of symbols are `a`

Algorithm:

* scan right
* mark `a` as `*`
* go back left
* remove a non-`a`
* repeat

Task:

* estimate time complexity

---

## 4. NP [10 points]

Same as:

* partition into equal sums

---

## 5. Reduction [5 points]

Reduce:

```
3-SAT ≤ Independent Set
```

Given clauses:

```
F1 = x1 ∨ x2
F2 = x1 ∨ x3
F3 = ¬x1 ∨ ¬x2
F4 = ¬x1 ∨ ¬x3
F5 = x2 ∨ x3
F6 = ¬x2 ∨ ¬x3
```

---

# 📄 **EXAM 3**

## 1. Turing Machine [10 points]

> ( L(x)=1 ) if ( x = a^k b^{2k+1} )

---

## 2. Undecidability [5 points]

Define:

> TRIS(M)=1 if there exist at least 3 inputs where M outputs 1

Task:

* prove undecidable

---

## 3. Big-O [10 points]

Which are true:

a) ( 3n^2 + 5n + 7 = O(n^3) )
b) ( 3n^2 + 5n + 7 = O(n \log^3 n) )
c) ( n^3 3^n = o(4^n) )

---

## 4. NP [10 points]

Graph labeling problem:

* assign numbers to vertices
* adjacent vertices differ ≤ d

Prove in NP

---

## 5. SPACE(log N) [10 points]

Show problem from Q1 is in:

```
SPACE(log N)
```
