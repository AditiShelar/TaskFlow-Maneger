package com.Assigment.Task.Repository;

import com.Assigment.Task.Entity.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User , ObjectId> {

    User findByUserName(String userName);


}
