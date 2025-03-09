# Jeu de Morpion (Tic-Tac-Toe)

Un jeu de morpion simple en ligne de commande, écrit en Python.

## Fonctionnalités

- Interface en ligne de commande
- Mode 2 joueurs (joueur contre joueur)
- Mode 1 joueur (joueur contre ordinateur)
- Grille de jeu 3x3 classique

## Comment jouer

1. Assurez-vous que Python 3 est installé sur votre système
2. Rendez le fichier exécutable (si ce n'est pas déjà fait) :
   ```
   chmod +x morpion.py
   ```
3. Lancez le jeu :
   ```
   ./morpion.py
   ```
   ou
   ```
   python3 morpion.py
   ```

## Règles du jeu

- Le jeu se joue sur une grille 3x3
- Le joueur X commence toujours
- Les joueurs placent alternativement leur symbole (X ou O) sur une case vide
- Le premier joueur qui aligne trois de ses symboles horizontalement, verticalement ou en diagonale gagne
- Si toutes les cases sont remplies sans qu'aucun joueur n'ait gagné, la partie est déclarée nulle

## Commandes

- Utilisez les chiffres 1-9 pour placer votre symbole selon cette disposition :
  ```
  7|8|9
  4|5|6
  1|2|3
  ```
- Appuyez sur 'q' pendant une partie pour abandonner

## Auteur

Ce jeu a été créé avec l'aide de Claude 3.7 Sonnet. 