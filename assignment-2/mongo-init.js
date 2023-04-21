

db.createUser(
    {
        user: 'user',
        pwd: 'rootpassword',
        roles: [
            {
                role: 'readWrite',
                db: 'yelp'
            }
        ]
    }
);