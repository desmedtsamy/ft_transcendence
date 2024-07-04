from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider

class FortyTwoProvider(OAuth2Provider):
    id = 'fortytwo'
    name = '42'
    #package = 'myapp.providers.fortytwo'
    
    def get_default_scope(self):
        return ['public']

    def extract_uid(self, data):
        return str(data['id'])

    def extract_common_fields(self, data):
        return dict(email=data['email'], username=data['login'])

provider_classes = [FortyTwoProvider]
