FROM node:boron

# Set up to build native modules
RUN apt-get update
RUN apt-get install -y build-essential

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY . /usr/src/app
RUN npm install

CMD [ "npm", "start" ]
