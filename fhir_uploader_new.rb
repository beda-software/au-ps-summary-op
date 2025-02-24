require 'json'
require 'fhir_client'
require 'base64'

SOURCE_BUNDLE_FILE = './resources/examples/everything-johnson-joyce.json'
FHIR_SERVER_URL = 'http://localhost:8888/fhir'
FHIR_USERNAME = ''
FHIR_PASSWORD = ''

client = FHIR::Client.new(FHIR_SERVER_URL)
client.default_json

if FHIR_USERNAME && FHIR_PASSWORD
  auth_token = Base64.strict_encode64("#{FHIR_USERNAME}:#{FHIR_PASSWORD}")
  client.additional_headers = {Authorization: "Basic #{auth_token}"}
end

def success_or_failure_message(response, action, resource)
  if response.response[:code].to_i.between?(200, 299)
    puts "Successfully #{action} : #{resource.resourceType}/#{response.resource&.id}"
  else
    puts "Failed to #{action} #{resource.resourceType}: #{response.response[:code]}"
    puts response.body
  end
end

def save_to_fhir_server(client, resource)
  read_response = client.read(resource.class.name, resource.id)
  if read_response.response[:code].to_i == 404
    response = client.create(resource)
    success_or_failure_message(response, 'create', resource)
  else
    response = client.update(resource, resource.id)
    success_or_failure_message(response, 'update', resource)
  end
end

bundle_data = JSON.parse(File.read(SOURCE_BUNDLE_FILE))
bundle = FHIR::Bundle.new(bundle_data)

bundle.entry.each do |entry|
  resource = entry.resource
  if resource
    save_to_fhir_server(client, resource)
  else
    puts 'Skipping entry without resource'
  end
end
