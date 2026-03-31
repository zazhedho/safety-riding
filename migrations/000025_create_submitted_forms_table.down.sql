DELETE FROM app_configs
WHERE config_key = 'approval_records.submitted_forms_sheet_url';

DROP TABLE IF EXISTS submitted_forms;
