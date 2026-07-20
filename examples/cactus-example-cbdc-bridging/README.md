# Hyperledger Cacti Example - CBDC Bridging between Fabric and Besu
## Running the backend
> Make sure you have all the dependencies set up.
On the terminal, issue the following commands in the project root:
1. `yarn install`
2. `yarn workspace @hyperledger-cacti/cactus-example-cbdc-bridging-backend start`

Wait for the output to show the message `CbdcBridgingApp running...`
## Running the frontend
### Using a pre-built Docker image
In a second terminal run:
`docker run -p 2000:2000 aaugusto11/cactus-example-cbdc-bridging-frontend`
### Running manually in live-reload mode
In a second terminal run (in the project root):
1. `cd examples/cactus-example-cbdc-bridging-frontend`
2. `yarn install`
3. `yarn start`
Visit `localhost:2000` and interact with the application. Do not change the port in your local machine, otherwise, the API servers might reject the requests.