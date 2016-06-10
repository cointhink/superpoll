all: test run

run:
	crystal run start.cr

test:
	crystal spec
