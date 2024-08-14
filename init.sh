#!/bin/bash

# Fonction pour imprimer du texte en couleur
print_color() {
  echo -e "\033[${1}m${2}\033[0m"
}

# Vérifie si le fichier .env existe
if [ ! -f .env ]; then
  while true; do
	echo -e "No \033[32m.env\033[0m file found. Do you want to create one from a \033[32m.envexample\033[0m file or stop and create your own ? (y/n) "
	read -r create
	if [[ $create =~ ^[YyNn]$ ]]; then
      break
    else
      print_color 31 "Invalid input. Please enter y or n."
    fi
  done

  if [[ $create =~ ^[Yy]$ ]]; then
    cp .envexemple .env
    print_color 32 ".env file created successfully."
	print_color 31 "don't forget to fill it with your own values for 42 api."
  else
    print_color 31 "Creation canceled. Exiting."
    exit 1
  fi
fi


