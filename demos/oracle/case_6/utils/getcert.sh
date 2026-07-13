#!/bin/bash

# Simple script to extract Fabric certificates for manual copy-paste
# Usage: ./getcert.sh > certs.txt

FABRIC_PATH="../../../../fabric-samples/test-network"

echo ""
echo "Fabric Certificate Extractor"
echo ""

# Function to format cert for JSON (with \n escapes)
format_for_json() {
    cat "$1" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed '$ s/\\n$//'
}

echo "1. ADMIN CERTIFICATE"
echo ""
ADMIN_CERT=$(find "$FABRIC_PATH/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/" -name "*.pem" 2>/dev/null | head -1)
if [ -f "$ADMIN_CERT" ]; then
    format_for_json "$ADMIN_CERT"
else
    echo "ERROR: Not found"
fi
echo ""
echo ""

echo "2. ADMIN PRIVATE KEY"
echo ""
ADMIN_KEY=$(find "$FABRIC_PATH/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/" -name "*_sk" 2>/dev/null | head -1)
if [ -f "$ADMIN_KEY" ]; then
    format_for_json "$ADMIN_KEY"
else
    echo "ERROR: Not found"
fi
echo ""
echo ""

echo "3. PEER0 ORG1 CA CERTIFICATE"
echo ""
PEER_CA="$FABRIC_PATH/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
if [ -f "$PEER_CA" ]; then
    format_for_json "$PEER_CA"
else
    echo "ERROR: Not found"
fi
echo ""
echo ""

echo "4. CA ORG1 CERTIFICATE"
echo ""
CA_ORG1="$FABRIC_PATH/organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem"
if [ -f "$CA_ORG1" ]; then
    format_for_json "$CA_ORG1"
else
    echo "ERROR: Not found"
fi
echo ""
echo ""

echo "5. ORDERER CA CERTIFICATE"
echo ""
ORDERER_CA="$FABRIC_PATH/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
if [ -f "$ORDERER_CA" ]; then
    format_for_json "$ORDERER_CA"
else
    echo "ERROR: Not found"
fi
echo ""
echo ""

echo "DONE - Copy each block above into your config"
echo ""
echo "WHERE TO PASTE:"
echo "1. Admin Certificate     -> userIdentity.credentials.certificate (line 61)"
echo "2. Admin Private Key     -> userIdentity.credentials.privateKey (line 62)"
echo "3. Peer0 Org1 CA Cert    -> connectionProfile.peers.peer0.org1.example.com.tlsCACerts.pem (line 122)"
echo "4. CA Org1 Certificate   -> connectionProfile.certificateAuthorities.ca.org1.example.com.tlsCACerts.pem[0] (line 135)"
echo "5. Orderer CA Certificate -> connectionProfile.orderers.orderer.example.com.tlsCACerts.pem (line 149)"