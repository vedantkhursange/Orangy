#!/bin/bash
# DO NOT COMMIT THIS FILE TO REVISION CONTROL (add to .gitignore if necessary)
# This script configures Vault with the required secrets and policies.

# Ensure Vault is unsealed and you are logged in
# vault login <your-root-token>

# 1. Enable KV Secrets Engine (Version 2) at the path 'secret'
vault secrets enable -path=secret kv-v2

# 2. Put Secrets
vault kv put secret/orangy/db password="your-secure-db-password"
vault kv put secret/orangy/jwt secret="your-secure-jwt-secret-key-at-least-256-bits"

# 3. Create a policy for the backend app
cat <<EOF > orangy-policy.hcl
path "secret/data/orangy/*" {
  capabilities = ["read"]
}
EOF
vault policy write orangy-policy orangy-policy.hcl

# 4. Enable Kubernetes authentication
vault auth enable kubernetes

# 5. Configure Kubernetes auth (Requires K8s API access from Vault)
# Adjust the kubernetes_host based on your k3s setup
vault write auth/kubernetes/config \
    kubernetes_host="https://10.43.0.1:443"

# 6. Create a role mapping the Kubernetes Service Account to the Vault Policy
vault write auth/kubernetes/role/orangy-role \
    bound_service_account_names=default \
    bound_service_account_namespaces=orangy-dev,orangy-prod \
    policies=orangy-policy \
    ttl=24h

echo "Vault setup complete!"
