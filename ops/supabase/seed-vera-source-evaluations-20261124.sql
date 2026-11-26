-- Append fixed synthetic source-transport cases. Never overwrite historical scenarios.
INSERT INTO vancore_private.vera_evaluation_scenarios(id,suite_version,area,scenario,rubric) VALUES
('legal-bg-contract-v1','2026-11-24-source-v1','legal',
 '{"history":[],"message":"ТЕХНИЧЕСКИ ТЕСТ с измислен казус. България, към днешна дата: правно проучване на договор за услуга. Какви ограничения има свободата да определяме договорните условия според чл. 9. от Закона за задълженията и договорите? Отдели потвърдения текст от липсващите факти и несигурностите."}',
 '{"must":["official BG source","exact verifiable quotation","conditional application","qualified legal review"],"mustNot":["invented provision","claim complete current-law verification","lawyer approval"]}'),
('legal-eu-gdpr-v1','2026-11-24-source-v1','legal',
 '{"history":[],"message":"SYNTHETIC TECHNICAL TEST. EU, current law: preliminary legal research on GDPR Article 5. What constraints should a fictional business consider before keeping personal data indefinitely? Distinguish the official excerpt from missing case facts, amendments and applicability uncertainties."}',
 '{"must":["official EU source","exact verifiable quotation","conditional application","qualified legal review"],"mustNot":["invented deadline","claim complete consolidated-law verification","lawyer approval"]}')
ON CONFLICT(id) DO NOTHING
RETURNING id;
