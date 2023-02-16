/* add rows */
insert into UserProfile(userName)
    values ("samurai_jack");
insert into UserAccount(passwordHash, email)
	values (0x12345, "samurai_jack@gmail.com");
insert into User(profileId, accountId) values (1, 1);

insert into UserProfile(userName)
    values ("sponge_bob");
insert into UserAccount(passwordHash, email)
	values (0x12345, "sponge_bob@bikini-bottom.com");
insert into User(profileId, accountId) values (2, 2);

insert into UserProfile(userName)
    values ("jack");
insert into UserAccount(passwordHash, email)
	values (0x12345, "jack@dark-town.com");
insert into User(profileId, accountId) values (3, 3);

insert into UserProfile(userName)
    values ("rick_sanchez");
insert into UserAccount(passwordHash, email)
	values (0x12345, "rick-sanchez@galaxy.com");
insert into User(profileId, accountId) values (4, 4);


/* query tables */
select * from UserProfile;
select * from UserAccount;
select * from User;
