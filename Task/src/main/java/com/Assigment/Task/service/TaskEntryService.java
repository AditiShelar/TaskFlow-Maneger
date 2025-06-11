package com.Assigment.Task.service;

import com.Assigment.Task.Entity.TaskEntry;
import com.Assigment.Task.Entity.User;
import com.Assigment.Task.Repository.TaskEntryRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Optional;


@Component
public class TaskEntryService {

    @Autowired
    private TaskEntryRepository TaskEntryRepo ;
    @Autowired
    private UserService userService;

    public void SaveEntry ( TaskEntry myEntry ,String userName){
        User user =userService.findByUserName(userName);
        TaskEntry saved = TaskEntryRepo.save(myEntry) ;
        user.getTaskEntries().add(saved);
        userService.SaveEntry(user);
    }
    public List<TaskEntry> findAll(){
        return TaskEntryRepo.findAll();

    }

    public Optional<TaskEntry> findbyID (ObjectId myId){
        return TaskEntryRepo.findById(myId);
    }

    public void deletebyId(ObjectId id ,String userName){
        User user =userService.findByUserName(userName);
        user.getTaskEntries().removeIf(x ->x.getId().equals(id));
        userService.SaveEntry(user);
        TaskEntryRepo.deleteById(id);

    }

//    public TaskEntry save(TaskEntry taskEntry) {
//        return TaskEntryRepo.save(taskEntry);
//    }


}
