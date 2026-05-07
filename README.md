# Game of Amazons AI Agent

## Overview

This project is a competitive AI agent for the board game *Game of the Amazons*, developed as part of a 4-person team project for COSC 322 (UBC).

The agent plays in real-time against other AI systems by generating legal moves, evaluating board states, and selecting optimal actions under strict time constraints.

The original repository was managed under a teammate’s GitHub account and later made private. To ensure continued accessibility for portfolio and recruitment purposes, this version was recreated locally from the original codebase and published here. The implementation and logic remain unchanged from the academic project.

---

## Tech Stack

- Java  
- Minimax Search Algorithm  
- Alpha-Beta Pruning  
- Breadth-First Search (BFS)  
- Heuristic Evaluation Functions  

---

## Key Features

### AI Decision Engine
- Implemented a **depth-limited Minimax algorithm** for adversarial search  
- Integrated **Alpha-Beta pruning**, reducing evaluated game-tree branches by ~60%  
- Optimized for real-time decision-making under strict turn time constraints  

### Move Generation System
- Fully compliant implementation of **queen movement and arrow-shooting rules**  
- Efficient generation of all legal moves for any board state  
- Designed for low-latency computation in competitive play  

### Heuristic Evaluation
- Custom evaluation function combining multiple strategic factors:
  - Territory control using **BFS-based reachability analysis**
  - Mobility advantage (available move space)
  - Positional advantage and board pressure

### Performance
- Achieved **14th place in a class-wide AI tournament**
- Maintained stable performance under real-time constraints
- Successfully balanced search depth vs. computation time

---

## System Design Highlights

- BFS-based territory estimation to evaluate board influence and control  
- Alpha-Beta pruning integrated directly into Minimax for efficiency gains  
- Modular architecture separating:
  - Move generation  
  - Game state evaluation  
  - Search/decision engine  
- Optimized for predictable time complexity during late-game scenarios  

---

## My Contributions

- Designed and implemented the **Minimax + Alpha-Beta pruning AI agent**
- Built full **move generation system** (queen movement + arrow logic)
- Developed **BFS-based heuristic for territory scoring**
- Tuned evaluation function for competitive strength and stability
- Assisted in debugging and optimizing performance under time constraints

---

## Project Context

- Course: COSC 322 (UBC)  
- Team Size: 4  
- Project Type: Competitive AI Game Agent  
- Language: Java  

---

## Notes on Repository History

This repository is a reconstructed version of the original team project for portfolio accessibility.

- Original codebase was developed collaboratively during the course  
- The initial repository was hosted under a teammate’s account and later made private  
- This version preserves the original implementation for demonstration and recruitment purposes  
- No changes have been made to alter functionality or results  

---

## Summary

This project demonstrates practical application of adversarial search, heuristic design, and performance optimization in a constrained real-time AI environment, with successful competitive evaluation in a structured tournament setting.
