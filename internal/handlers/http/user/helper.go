package handleruser

func (h *HandlerUser) isPublicRegistrationEnabled() (bool, error) {
	if h.AppConfigService == nil {
		return true, nil
	}

	return h.AppConfigService.IsEnabled(publicRegistrationConfigKey, true)
}
