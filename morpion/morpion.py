#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Jeu de Morpion (Tic-Tac-Toe) en ligne de commande
"""

import os
import random
import time

class Morpion:
    def __init__(self):
        # Initialisation de la grille (3x3)
        self.grille = [' ' for _ in range(9)]
        self.joueur_actuel = 'X'  # Le joueur X commence
        self.partie_terminee = False
        self.vainqueur = None

    def afficher_grille(self):
        """Affiche la grille de jeu"""
        os.system('clear' if os.name == 'posix' else 'cls')
        print("\n===== MORPION =====\n")
        print(f" {self.grille[0]} | {self.grille[1]} | {self.grille[2]} ")
        print("---+---+---")
        print(f" {self.grille[3]} | {self.grille[4]} | {self.grille[5]} ")
        print("---+---+---")
        print(f" {self.grille[6]} | {self.grille[7]} | {self.grille[8]} ")
        print("\n==================\n")

    def verifier_case_valide(self, position):
        """Vérifie si la case est valide et disponible"""
        if position < 0 or position > 8:
            return False
        return self.grille[position] == ' '

    def placer_symbole(self, position):
        """Place le symbole du joueur actuel à la position donnée"""
        if self.verifier_case_valide(position):
            self.grille[position] = self.joueur_actuel
            return True
        return False

    def changer_joueur(self):
        """Change le joueur actuel"""
        self.joueur_actuel = 'O' if self.joueur_actuel == 'X' else 'X'

    def verifier_victoire(self):
        """Vérifie s'il y a un vainqueur"""
        # Lignes horizontales
        for i in range(0, 9, 3):
            if self.grille[i] != ' ' and self.grille[i] == self.grille[i+1] == self.grille[i+2]:
                self.partie_terminee = True
                self.vainqueur = self.grille[i]
                return True

        # Lignes verticales
        for i in range(3):
            if self.grille[i] != ' ' and self.grille[i] == self.grille[i+3] == self.grille[i+6]:
                self.partie_terminee = True
                self.vainqueur = self.grille[i]
                return True

        # Diagonales
        if self.grille[0] != ' ' and self.grille[0] == self.grille[4] == self.grille[8]:
            self.partie_terminee = True
            self.vainqueur = self.grille[0]
            return True
        if self.grille[2] != ' ' and self.grille[2] == self.grille[4] == self.grille[6]:
            self.partie_terminee = True
            self.vainqueur = self.grille[2]
            return True

        return False

    def verifier_match_nul(self):
        """Vérifie s'il y a match nul"""
        if ' ' not in self.grille and not self.verifier_victoire():
            self.partie_terminee = True
            return True
        return False

    def coup_ia(self):
        """L'IA joue un coup (simple: aléatoire)"""
        positions_disponibles = [i for i, case in enumerate(self.grille) if case == ' ']
        if positions_disponibles:
            return random.choice(positions_disponibles)
        return -1

    def jouer_partie(self, mode="2J"):
        """Joue une partie complète"""
        self.afficher_grille()
        
        while not self.partie_terminee:
            if self.joueur_actuel == 'X' or mode == "2J":
                # Tour du joueur humain
                print(f"C'est au tour du joueur {self.joueur_actuel}")
                print("Entrez un nombre entre 1-9 (position sur la grille):")
                print("7|8|9")
                print("4|5|6")
                print("1|2|3")
                
                try:
                    position_input = input("> ")
                    if position_input.lower() == 'q':
                        print("Partie abandonnée.")
                        return
                    
                    # Conversion de l'entrée utilisateur en position de grille (0-8)
                    position_map = {
                        '1': 6, '2': 7, '3': 8,
                        '4': 3, '5': 4, '6': 5,
                        '7': 0, '8': 1, '9': 2
                    }
                    
                    position = position_map.get(position_input, -1)
                    
                    if not self.placer_symbole(position):
                        print("Position invalide! Réessayez.")
                        time.sleep(1)
                        self.afficher_grille()
                        continue
                except (ValueError, KeyboardInterrupt):
                    print("Entrée invalide! Réessayez.")
                    time.sleep(1)
                    self.afficher_grille()
                    continue
            else:
                # Tour de l'IA
                print("L'ordinateur réfléchit...")
                time.sleep(0.5)
                position = self.coup_ia()
                self.placer_symbole(position)
            
            self.afficher_grille()
            
            # Vérifier s'il y a un vainqueur ou match nul
            if self.verifier_victoire():
                print(f"Le joueur {self.vainqueur} a gagné!")
                break
            
            if self.verifier_match_nul():
                print("Match nul!")
                break
            
            # Passer au joueur suivant
            self.changer_joueur()

def menu_principal():
    """Affiche le menu principal du jeu"""
    os.system('clear' if os.name == 'posix' else 'cls')
    print("\n===== MORPION =====\n")
    print("1. Jouer à 2 joueurs")
    print("2. Jouer contre l'ordinateur")
    print("3. Quitter")
    
    choix = input("\nVotre choix: ")
    
    if choix == '1':
        jeu = Morpion()
        jeu.jouer_partie(mode="2J")
    elif choix == '2':
        jeu = Morpion()
        jeu.jouer_partie(mode="1J")
    elif choix == '3':
        print("Au revoir!")
        exit()
    else:
        print("Choix invalide!")
        time.sleep(1)
    
    # Demander si le joueur veut rejouer
    rejouer = input("\nVoulez-vous rejouer? (o/n): ")
    if rejouer.lower() == 'o':
        menu_principal()

if __name__ == "__main__":
    try:
        menu_principal()
    except KeyboardInterrupt:
        print("\nJeu interrompu. Au revoir!") 