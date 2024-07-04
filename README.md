# ft_transcendence
class SettingsView(LoginRequiredMixin, UpdateView):
	model = User
	form_class = UserSettingsForm
	template_name = 'account/settings.html'
	success_url = reverse_lazy('home')

	def get_object(self, queryset=None):
		return self.request.user

	def form_valid(self, form):
		user = form.save()

		# Vérifie si l'utilisateur a changé son mot de passe
		if form.cleaned_data.get('new_password1'):
			update_session_auth_hash(self.request, user)  # Met à jour la session
			messages.success(self.request, "Votre mot de passe a été changé avec succès.")

		messages.success(self.request, 'Vos paramètres ont été mis à jour.')
		return super().form_valid(form)
	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		if 'form' not in context: 
			context['form'] = self.form_class(instance=self.request.user)  # Handle GET
		if self.request.POST:
			context['form'] = self.form_class(self.request.POST, self.request.FILES, instance=self.request.user)  # Handle POST
		if 'password_form' not in context:
			context['password_form'] = PasswordChangeForm(user=self.request.user)
		return context