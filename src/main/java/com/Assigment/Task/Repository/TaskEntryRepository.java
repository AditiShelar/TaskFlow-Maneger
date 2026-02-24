package com.Assigment.Task.Repository;

import com.Assigment.Task.Entity.TaskEntry;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TaskEntryRepository extends MongoRepository <TaskEntry, ObjectId> {
}
