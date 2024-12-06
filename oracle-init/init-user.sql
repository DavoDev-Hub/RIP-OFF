alter session set container = xepdb1;

create user davo identified by al280622;
grant connect,resource to davo;
grant
   create table
to davo;
grant
   create view
to davo;
alter user davo
   quota unlimited on users;
grant
   create session
to davo;