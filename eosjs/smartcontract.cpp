#include<eosio/eosio.hpp>
using namespace eosio;

class [[eosio::contract("phonebook")]] phonebook : public eosio::contract {
   public:

      phonebook(name receiver, name code, datastream<const char*> ds) : contract(receiver, code, ds) {}

      [[eosio::action]]
      void upsert(name user, int phonenum){
         require_auth(user);
         phone_index phonenums( get_self(), get_first_receiver().value);
         auto iterator = phonenums.find(user.value);
         if( iterator == phonenums.end() )
         {
            phonenums.emplace(user, [&]( auto& row ) {
               row.key = user;
               row.phonenum = phonenum;
            });
         }
         else {
            phonenums.modify(iterator, user, [&]( auto& row ) {
               row.key = user;
               row.phonenum = phonenum;
            });
         }
      }      

      [[eosio::action]]
      void erase(name user) {
         require_auth(user);

         phone_index phonenums( get_self(), get_first_receiver().value);

         auto iterator = phonenums.find(user.value);
         check(iterator != phonenums.end(), "Record does not exist!");
         phonenums.erase(iterator);
      }


   private:
      struct [[eosio::table]] person {
         name key;
         int phonenum;
         uint64_t primary_key() const { return key.value;}
   };
   using phone_index = eosio::multi_index<"people"_n, person>;
};
