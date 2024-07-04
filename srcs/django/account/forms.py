from django.contrib.auth.forms import AuthenticationForm, UserCreationForm, UserChangeForm, PasswordChangeForm
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django import forms
from .models import User

class LoginForm(AuthenticationForm):
	"""
	Formulaire de connexion personnalisé basé sur AuthenticationForm de Django.
	"""
	
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		for field_name, field in self.fields.items():
			field.widget.attrs.update({'placeholder': field.label})
			#field.label = ""
			field.help_text = None


class RegisterForm(UserCreationForm):
	"""
	Formulaire d'inscription personnalisé basé sur UserCreationForm de Django.
	"""
	class Meta:
		model = User
		fields = ('username', 'email')

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)

		#del self.fields['password2']
		for field_name, field in self.fields.items():
			field.widget.attrs.update({'placeholder': field.label})
			field.help_text = None
	def clean_email(self):
		"""
		Validation personnalisée de l'e-mail pour empêcher les doublons.
		"""
		email = self.cleaned_data['email'].lower()
		if User.objects.filter(email__iexact=email).exists():
			raise ValidationError("Cet e-mail est déjà utilisé.")
		return email
	def clean_username(self):
		username = self.cleaned_data['username']
		if User.objects.filter(username=username).exists():
			raise ValidationError("Ce nom d'utilisateur est déjà utilisé.")
		return username
	

class UserSettingsForm(forms.ModelForm):
    username = forms.CharField(label="Nom d'utilisateur")
    email = forms.EmailField(label='Adresse e-mail')
    avatar = forms.ImageField(label='Avatar', required=False)
    old_password = forms.CharField(widget=forms.PasswordInput, label='Ancien mot de passe', required=False)
    new_password1 = forms.CharField(widget=forms.PasswordInput, label='Nouveau mot de passe', required=False)
    new_password2 = forms.CharField(widget=forms.PasswordInput, label='Confirmez le nouveau mot de passe', required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'avatar')

    def clean_username(self):
        username = self.cleaned_data['username']
        if User.objects.filter(username=username).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return username

    def clean_old_password(self):
        old_password = self.cleaned_data.get('old_password')
        if old_password and not self.instance.check_password(old_password):
            raise forms.ValidationError("L'ancien mot de passe est incorrect.")
        return old_password

    def clean_new_password2(self):
        new_password1 = self.cleaned_data.get('new_password1')
        new_password2 = self.cleaned_data.get('new_password2')
        if new_password1 and new_password2 and new_password1 != new_password2:
            raise forms.ValidationError("Les nouveaux mots de passe ne correspondent pas.")

        if new_password1:
            validate_password(new_password1, self.instance)  # Validation du mot de passe

        return new_password2